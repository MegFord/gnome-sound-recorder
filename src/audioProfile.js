/*
 * Copyright 2013 Meg Ford
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Library General Public
 * License as published by the Free Software Foundation; either
 * version 2 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Library General Public License for more details.
 *
 * You should have received a copy of the GNU Library General Public
 * License along with this library; if not, write to the
 * Free Software Foundation, Inc., 59 Temple Place - Suite 330,
 * Boston, MA 02111-1307, USA.
 *
 *  Author: Meg Ford <megford@gnome.org>
 *
 */
 
 //GST_DEBUG=4 ./src/gnome-sound-recorder
 
imports.gi.versions.Gst = '1.0';

const _ = imports.gettext.gettext;
const Gio = imports.gi.Gio;
const Gst = imports.gi.Gst;
const GstPbutils = imports.gi.GstPbutils;
const Mainloop = imports.mainloop;

const containerProfileMap = {
    OGG: "application/ogg", 
    MP3: "application/x-id3",
    AAC: "video/quicktime,variant=(string)iso"
};

const audioCodecMap = {
    FLAC: "audio/x-flac",      
    MP3: "audio/mpeg,mpegversion=(int)1,layer=(int)3",
    AAC: "audio/mpeg,mpegversion=(int)4",
    OGG_OPUS: "audio/x-opus", 
    OGG_VORBIS: "audio/x-vorbis"
};

const comboBoxMap = {
    OGG_VORBIS: 0,
    OGG_OPUS: 1,
    FLAC: 2,
    MP3: 3,
    AAC: 4
};


const AudioProfile = new Lang.Class({
    Name: 'AudioProfile',
   
    assignProfile: function(profileName){
        this.profileName = profileName;
        this._values = [];
            switch(this.profileName) {
                             
                case comboBoxMap.OGG_VORBIS:
                    this._values.push({ container: containerProfileMap.OGG, audio: audioCodecMap.OGG_VORBIS });
                    break;
                case comboBoxMap.OGG_OPUS:
                    this._values.push({ container: containerProfileMap.OGG, audio: audioCodecMap.OGG_OPUS }); 
                    break;
                case comboBoxMap.FLAC:
                    this._values.push({ container: containerProfileMap.OGG, audio: audioCodecMap.FLAC });
                    break;
                case comboBoxMap.MP3:
                    this._values.push({ container: containerProfileMap.MP3, audio: audioCodecMap.MP3 });
                    break;
                case comboBoxMap.AAC:
                    this._values.push({ container: containerProfileMap.AAC, audio: audioCodecMap.AAC });
                    break;
                default:
                    break;
            }
    },
       
    mediaProfile: function(){
        let idx = 0;
                
        if (this._values[idx].container) {
            log(this._values[idx].container);
            log(this._values[idx].audio);
            let caps = Gst.Caps.from_string(this._values[idx].container);
            this.containerProfile = GstPbutils.EncodingContainerProfile.new("record", null, caps, null);
            this.audioCaps = Gst.Caps.from_string(this._values[idx].audio);
            this.encodingProfile = GstPbutils.EncodingAudioProfile.new(this.audioCaps, null, null, 1);
            this.containerProfile.add_profile(this.encodingProfile);
            return this.containerProfile;
        } else if (!this._values[idx].container && this._values[idx].audio) {
            this.audioCaps = Gst.Caps.from_string(this._values[idx].audio);
            this.encodingProfile = GstPbutils.EncodingAudioProfile.new(this.audioCaps, null, null, 1);
            return this.encodingProfile;
        } else {
            return -1; 
        }     
    },
    
    fileExtensionReturner: function() {
        let idx = 0;
        
        if (this._values[idx].audio) {
            this.suffixName = this.encodingProfile.get_file_extension();
            if (this.suffixName == null) 
                this.suffixName = this.containerProfile.get_file_extension();
        }  
        
        this.audioSuffix = ("." + this.suffixName);
        return this.audioSuffix;   
    }
});
