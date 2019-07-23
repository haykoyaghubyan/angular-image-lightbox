import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import {ImageService} from './services/image.service';
import { ImageLightboxComponent } from './components/image-lightbox/image-lightbox.component'

@NgModule({
  declarations: [
    AppComponent,
    ImageLightboxComponent,
  ],
  imports: [
    BrowserModule
  ],
  providers: [ImageService],
  bootstrap: [AppComponent]
})
export class AppModule { }
