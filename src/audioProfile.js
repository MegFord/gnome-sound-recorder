/*
 *  Author: Meg Ford <megford@gnome.org>
 *
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
    MPEG: "video/mpeg"
};

const audioCodecMap = {
    FLAC: "audio/x-flac",      
    MP3: "audio/mpeg",
    MP4: "audio/mpeg",
    OGG_OPUS: "audio/x-celt",//"audio/x-opus", 
    OGG_VORBIS: "audio/x-vorbis"
};

const audioSuffixMap = { 
    MP3: ".mp3",
    MP4: ".aac",
    OGG_VORBIS: ".ogg", 
    OGG_OPUS: ".opus"      
};

const noContainerSuffixMap = {
    FLAC: ".flac"
};

const comboBoxMap = {
    OGG_VORBIS: 0,
    OGG_OPUS: 1,
    FLAC: 2,
    MP3: 3,
    MP4: 4
};


const AudioProfile = new Lang.Class({
    Name: 'AudioProfile',
   
    assignProfile: function(profileName){
        this.profileName = profileName;
        this._values = [];
            switch(this.profileName) {
                             
                case comboBoxMap.OGG_VORBIS:
                    this._values.push({ container: containerProfileMap.OGG, audio: audioCodecMap.OGG_VORBIS, suffix: audioSuffixMap.OGG_VORBIS });
                    break;
                case comboBoxMap.OGG_OPUS:
                    this._values.push({ container: containerProfileMap.OGG, audio: audioCodecMap.OGG_OPUS, suffix: audioSuffixMap.OGG_OPUS }); 
                    break;
                case comboBoxMap.FLAC:
                    this._values.push({ container: null, audio: audioCodecMap.FLAC, suffix: noContainerSuffixMap.FLAC });
                    break;
                case comboBoxMap.MP3:
                    this._values.push({ container: containerProfileMap.MPEG, audio: audioCodecMap.MP3, suffix: audioSuffixMap.MP3 });
                    break;
                case comboBoxMap.MP4:
                    this._values.push({ container: containerProfileMap.MPEG, audio: audioCodecMap.MP4, suffix: audioSuffixMap.MP4 });
                    break;
                default:
                    break;
            }
    },
       
    mediaProfile: function(){
        let idx = 0;
        
        if (this._values[idx].container) {
            let struct = Gst.Structure.new_empty(this._values[idx].container);
            let caps = Gst.Caps.new_empty();
            caps.append_structure(struct);
            let containerProfile = GstPbutils.EncodingContainerProfile.new("record", null, caps, null);
            let audioStruct = Gst.Structure.new_empty(this._values[idx].audio);

            // Special case MPEG formats here for the sake of brevity
            if (this._values[idx].suffix == audioSuffixMap.MP3) {
                audioStruct.set_value("mpegversion", 1);
                audioStruct.set_value("layer", 3);
            }
            
            if (this._values[idx].suffix == audioSuffixMap.MP4) {
                 audioStruct.set_value("mpegversion", 4);
            }
            
            let audioCaps = Gst.Caps.new_empty();
            audioCaps.append_structure(audioStruct);
            let encodingProfile = GstPbutils.EncodingAudioProfile.new(audioCaps, null, null, 1);
            containerProfile.add_profile(encodingProfile);
            return encodingProfile;
        } else if (!this._values[idx].container && this._values[idx].audio) {
            let audioStruct = Gst.Structure.new_empty(this._values[idx].audio);
            
            let audioCaps = Gst.Caps.new_empty();
            audioCaps.append_structure(audioStruct);
            let encodingProfile = GstPbutils.EncodingAudioProfile.new(audioCaps, null, null, 1);
            return encodingProfile;
        } else {
            return -1; 
        }     
    },
    
    fileExtensionReturner: function() {
        let idx = 0;
        
        if (this._values[idx].suffix != null) {
            return this._values[idx].suffix;
        } else {
            log("Please choose an Audio Profile");
            return audioSuffixMap.OGG_VORBIS;
        }    
    }
});
