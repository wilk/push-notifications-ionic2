import { Component, ViewChild } from '@angular/core';

import { Platform, MenuController, Nav } from 'ionic-angular';

import { StatusBar, Splashscreen, Push, Network } from 'ionic-native';

import {Http, Response} from '@angular/http'

import { HelloIonicPage } from '../pages/hello-ionic/hello-ionic';
import { ListPage } from '../pages/list/list';

import {Observable} from 'rxjs'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/mergeMap'


@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  @ViewChild(Nav) nav: Nav;

  // make HelloIonicPage the root (or first) page
  rootPage: any = HelloIonicPage;
  pages: Array<{title: string, component: any}>;

  constructor(
    public platform: Platform,
    public menu: MenuController,
    public http: Http
  ) {
    this.initializeApp();

    // set our app's pages
    this.pages = [
      { title: 'Hello Ionic', component: HelloIonicPage },
      { title: 'My First List', component: ListPage }
    ];
  }

  initializeApp() {
    this.platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      StatusBar.styleDefault();
      Splashscreen.hide();
      
      if (!this.platform.is('cordova')) return
      
      // external IP
      // it requires port mapping (3001:3001 tcp)
      const API_URL = 'http://_nodejs_external_ip_:3001'
      
      let observable = Observable.of('')
      if (Network.connection === 'none') {
        console.log('NONE CONNECTION')
        observable = Network.onConnect()
      }
      observable.flatMap(() => {
        console.log('GETTING SENDER')
        return this.http.get(`${API_URL}/sender`)
          })
          .map((res: Response) => res.json())
          .flatMap(data => {
            console.log('GOT SENDER', data)
            return Observable.fromEvent(Push.init({android: {senderID: data.senderId}}), 'registration', data => data.registrationId)
          })
          .flatMap(registrationId => {
            console.log('REGISTERING ON NPM', registrationId)
            return this.http.post(`${API_URL}/register`, {registrationId: registrationId})
          })
          .subscribe()
    });
  }

  openPage(page) {
    // close the menu when clicking a link from the menu
    this.menu.close();
    // navigate to the new page if it is not the current page
    this.nav.setRoot(page.component);
  }
}
