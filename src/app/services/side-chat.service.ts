import { Injectable } from '@angular/core'
import { SideChat } from '@models/side-chat.model';

let date = new Date(),
  day = date.getDate(),
  month = date.getMonth(),
  year = date.getFullYear(),
  hour = date.getHours(),
  minute = date.getMinutes();

let chats = [
  new SideChat(
    'img/profile/ashley.jpg',
    'Ashley Ahlberg',
    'Online',
    'Hi, I\'m looking for admin template with bootstrap 4.  What do you think about StartNG Admin Template?',
    new Date(year, month, day - 2, hour, minute),
    'left'
  ),
  new SideChat(
    'img/profile/bruno.jpg',
    'Bruno Vespa',
    'Do not disturb',
    'Hi, I\'m looking for admin template with bootstrap 4.  What do you think about StartNG Admin Template?',
    new Date(year, month, day - 2, hour, minute),
    'left'
  ),
  new SideChat(
    'img/avatars/avatar-3.png',
    'Andy Warhol',
    'Online',
    'Hi, I\'m looking for admin template with bootstrap 4.  What do you think about StartNG Admin Template?',
    new Date(year, month, day - 2, hour, minute),
    'left'
  ),
  new SideChat(
    'img/profile/julia.jpg',
    'Julia Aniston',
    'Away',
    'Hi, I\'m looking for admin template with bootstrap 4.  What do you think about StartNG Admin Template?',
    new Date(year, month, day - 2, hour, minute),
    'left'
  ),
  new SideChat(
    'img/profile/adam.jpg',
    'Adam Sandler',
    'Online',
    'Hi, I\'m looking for admin template with bootstrap 4.  What do you think about StartNG Admin Template?',
    new Date(year, month, day - 2, hour, minute),
    'left'
  ),
  new SideChat(
    'img/avatars/avatar-7.png',
    'Lusia Manuel',
    'Online',
    'Hi, I\'m looking for admin template with bootstrap 4.  What do you think about StartNG Admin Template?',
    new Date(year, month, day - 2, hour, minute),
    'left'
  ),
  new SideChat(
    'img/profile/tereza.jpg',
    'Tereza Stiles',
    'Offline',
    'Hi, I\'m looking for admin template with bootstrap 4.  What do you think about StartNG Admin Template?',
    new Date(year, month, day - 2, hour, minute),
    'left'
  ),
  new SideChat(
    'img/users/default-user.jpg',
    'unknown',
    'Offline',
    'Hi, I\'m looking for admin template with bootstrap 4.  What do you think about StartNG Admin Template?',
    new Date(year, month, day - 2, hour, minute),
    'left'
  ),
  new SideChat(
    'img/avatars/avatar-1.png',
    'Jeremi Powell',
    'Online',
    'Hi, I\'m looking for admin template with bootstrap 4.  What do you think about StartNG Admin Template?',
    new Date(year, month, day - 2, hour, minute),
    'left'
  ),
  new SideChat(
    'img/avatars/avatar-8.png',
    'Calico Jack',
    'Online',
    'Hi, I\'m looking for admin template with bootstrap 4.  What do you think about StartNG Admin Template?',
    new Date(year, month, day - 2, hour, minute),
    'left'
  ),
  new SideChat(
    'img/profile/michael.jpg',
    'Michael Blair',
    'Online',
    'Hi, I\'m looking for admin template with bootstrap 4.  What do you think about StartNG Admin Template?',
    new Date(year, month, day - 2, hour, minute),
    'left'
  ),
  new SideChat(
    'img/avatars/avatar-5.png',
    'Michelle Ormond',
    'Away',
    'Hi, I\'m looking for admin template with bootstrap 4.  What do you think about StartNG Admin Template?',
    new Date(year, month, day - 2, hour, minute),
    'left'
  ),
  new SideChat(
    'img/avatars/avatar-6.png',
    'Sean Connery',
    'Offline',
    'Hi, I\'m looking for admin template with bootstrap 4.  What do you think about StartNG Admin Template?',
    new Date(year, month, day - 2, hour, minute),
    'left'
  )
]

let talks = [
  new SideChat(
    'img/users/user.jpg',
    'Emilio Verdines',
    'Online',
    'Hi, StartNG is a fully responsive, organized folder structure, clean & customizable code, easy to use and much more...',
    new Date(year, month, day - 2, hour, minute + 2),
    'right'
  ),
  new SideChat(
    'img/profile/ashley.jpg',
    'Ashley Ahlberg',
    'Online',
    'Great, then I\'ll definitely buy this theme. Thanks!',
    new Date(year, month, day - 2, hour, minute + 3),
    'left'
  ),
]

@Injectable()
export class SideChatService {

  public getChats(): Array<Object> {
    return chats;
  }

  public getTalk(): Array<Object> {
    return talks;
  }

}