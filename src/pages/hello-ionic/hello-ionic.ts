import { Component, NgZone } from '@angular/core';
import { Http, Response } from '@angular/http'
import { Push, Network } from 'ionic-native';
import { Platform } from 'ionic-angular';

import {Observable} from 'rxjs'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/mergeMap'

@Component({
  selector: 'page-hello-ionic',
  templateUrl: 'hello-ionic.html'
})
export class HelloIonicPage {
  public message: string = ''
  public notifications: any = []
  public disabled: boolean = false

  constructor(public zone: NgZone, public platform: Platform, public http: Http) {}

  register(address: string = ''): void {
    if (address.length === 0) {
      this.message = 'an address IP with port is needed'
      return
    }

    this.platform.ready().then(() => {
      if (!this.platform.is('cordova')) {
        this.message = 'this is not a Cordova platform'
        return
      }

      let pusher: any

      let observable = Observable.of('')

      if (Network.connection === 'none') {
        console.log('NONE CONNECTION')
        this.message = 'not connected, waiting for connection'
        observable = Network.onConnect()
      }

      observable.flatMap(() => {
            this.message = 'getting sender...'
            console.log('GETTING SENDER')
            return this.http.get(`${address}/sender`)
          })
          .map((res:Response) => res.json())
          .flatMap(data => {
            this.message = `got sender -> ${data.senderId}`
            console.log('GOT SENDER', data)
            pusher = Push.init({android: {senderID: data.senderId}})
            return Observable.fromEvent(pusher, 'registration', data => data.registrationId)
          })
          .flatMap(registrationId => {
            this.message = `registering on registration backend with id ${registrationId}...`
            console.log('REGISTERING ON NPM', registrationId)
            return this.http.post(`${address}/register`, {registrationId: registrationId})
          })
          .flatMap(() => {
            this.message = 'registration done! waiting for push notifications'

            this.disabled = true

            return Observable.fromEvent(pusher, 'notification', data => data)
          })
          .map(notification => this.notifications.push(notification))
          .subscribe(() => {
            this.zone.run(() => {})
          })
    })
  }
}
