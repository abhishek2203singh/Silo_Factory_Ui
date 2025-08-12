import { Component, ViewEncapsulation } from '@angular/core';
import { SideChat } from '@models/side-chat.model';
import { Settings, SettingsService } from '@services/settings.service';
import { SideChatService } from '@services/side-chat.service';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { PipesModule } from '../../pipes/pipes.module';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-side-chat',
    standalone: true,
    imports: [
        NgScrollbarModule,
        PipesModule,
        DatePipe,
        FormsModule
    ],
    templateUrl: './side-chat.component.html',
    styleUrls: ['./side-chat.component.scss'],
    encapsulation: ViewEncapsulation.None,
    providers: [SideChatService]
})
export class SideChatComponent {
    public settings: Settings;
    public showHoverableChatItem: boolean = false;
    public showChatWindow: boolean = false;
    public chats: Array<any>;
    public talks: Array<any>;
    public interlocutor: string;
    public searchText: string;
    public newChatText: string = '';

    constructor(public settingsService: SettingsService, private sideChatService: SideChatService) {
        this.settings = this.settingsService.settings;
        this.chats = sideChatService.getChats();
        this.talks = this.sideChatService.getTalk();
    }

    public back() {
        this.showChatWindow = false
        this.talks.shift();
        this.talks.length = 2;
    }

    public getChat(chat: SideChat) {
        this.searchText = '';
        this.showChatWindow = true;
        this.interlocutor = chat.author;
        this.talks.forEach(item => {
            if (item.side == 'left') {
                item.image = chat.image;
            }
        });
        this.talks.unshift(chat);
    }

    public addChatItem($event: any) {
        if (($event.which === 1 || $event.which === 13) && this.newChatText.trim() != '') {
            this.talks.push(
                new SideChat(
                    'img/users/user.jpg',
                    'Emilio Verdines',
                    'online',
                    this.newChatText,
                    new Date(),
                    'right')
            )
            this.newChatText = '';
            const chatContainer = document.querySelector('.chat-talk-list');
            if (!chatContainer) {
                return;
            }
            setTimeout(() => {
                var nodes = chatContainer.querySelectorAll('.media');
                let newChatTextHeight = nodes[nodes.length - 1];
                chatContainer.scrollTop = chatContainer.scrollHeight + newChatTextHeight.clientHeight;
            });
        }
    }

}