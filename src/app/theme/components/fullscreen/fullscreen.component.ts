import { Component, ViewEncapsulation, ViewChild, HostListener, ElementRef } from '@angular/core';

@Component({
    selector: 'app-fullscreen',
    standalone: true,
    encapsulation: ViewEncapsulation.None,
    template: `
    <span class="pl-2 pr-2">
      @if (!toggle) {
        <i #expand class="fa fa-expand transition"></i>
      }
      @if (toggle) {
        <i #compress class="fa fa-compress transition"></i>
      }
    </span>
    `
})
export class FullScreenComponent {
    toggle: boolean = false;
    @ViewChild('expand') private expand: ElementRef;
    @ViewChild('compress') private compress: ElementRef;

    requestFullscreen(elem: any) {
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        } else {
            // ('Fullscreen API is not supported.');
        }
    };

    exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        } else {
            // ('Fullscreen API is not supported.');
        }
    };

    @HostListener('click') getFullscreen() {
        if (this.expand) {
            this.requestFullscreen(document.documentElement);
        }
        if (this.compress) {
            this.exitFullscreen();
        }
    }

    @HostListener('window:resize') onFullScreenChange() {
        let fullscreenElement = document.fullscreenElement || document.mozFullScreenElement ||
            document.webkitFullscreenElement || document.msFullscreenElement;
        if (fullscreenElement != null) {
            this.toggle = true;
        } else {
            this.toggle = false;
        }
    }

}