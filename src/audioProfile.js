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
 
imports.gi.versions.Gst = '1.0';

const _ = imports.gettext.gettext;
const Gio = imports.gi.Gio;
const Gst = imports.gi.Gst;
const GstPbutils = imports.gi.GstPbutils;
const Mainloop = imports.mainloop;

const MainWindow = imports.mainWindow;
const Preferences = imports.preferences;

const comboBoxMap = {
    OGG_VORBIS: 0,
    OPUS: 1,
    FLAC: 2,
    MP3: 3,
    MP4: 4
};

const containerProfileMap = {
    OGG: "application/ogg", 
    ID3: "application/x-id3",
    MP4: "video/quicktime,variant=(string)iso"
};


const audioCodecMap = {
    FLAC: "audio/x-flac",      
    MP3: "audio/mpeg,mpegversion=(int)1,layer=(int)3",
    MP4: "audio/mpeg,mpegversion=(int)4",
    OPUS: "audio/x-opus", 
    VORBIS: "audio/x-vorbis"
};


const AudioProfile = new Lang.Class({
    Name: 'AudioProfile',
   
    profile: function(profileName){
        if (profileName)
            this._profileName = profileName;
       else 
            this._profileName = comboBoxMap.OGG_VORBIS;
            
        this._values = [];
            switch(this._profileName) {
                             
                case comboBoxMap.OGG_VORBIS:
                    this._values.push({ container: containerProfileMap.OGG, audio: audioCodecMap.VORBIS });
                    break;
                case comboBoxMap.OPUS:
                    this._values.push({ container: containerProfileMap.OGG, audio: audioCodecMap.OPUS }); 
                    break;
                case comboBoxMap.FLAC:
                    this._values.push({ audio: audioCodecMap.FLAC });
                    break;
                case comboBoxMap.MP3:
                    this._values.push({ container: containerProfileMap.ID3, audio: audioCodecMap.MP3 });
                    break;
                case comboBoxMap.MP4:
                    this._values.push({ container: containerProfileMap.MP4, audio: audioCodecMap.MP4 });
                    break;
                default:
                    break;
            }
    },
       
    mediaProfile: function(){
        let idx = 0;
        let audioCaps; 
        this._containerProfile = null;
               
        if (this._values[idx].container) {
            let caps = Gst.Caps.from_string(this._values[idx].container);
            this._containerProfile = GstPbutils.EncodingContainerProfile.new("record", null, caps, null);
            audioCaps = Gst.Caps.from_string(this._values[idx].audio);
            this.encodingProfile = GstPbutils.EncodingAudioProfile.new(audioCaps, null, null, 1);
            this._containerProfile.add_profile(this.encodingProfile);
            return this._containerProfile;
        } else if (!this._values[idx].container && this._values[idx].audio) {
            audioCaps = Gst.Caps.from_string(this._values[idx].audio);
            this.encodingProfile = GstPbutils.EncodingAudioProfile.new(audioCaps, null, null, 1);
            return this.encodingProfile;
        } else {
            return -1; 
        }    
    },
    
    fileExtensionReturner: function() {
        let idx = 0;
        let suffixName;
        
        if (this._values[idx].audio) {
            if (this._containerProfile != null)
                suffixName = this._containerProfile.get_file_extension();
            
            if (suffixName == null) 
                suffixName = this.encodingProfile.get_file_extension();
        }  
        
        this.audioSuffix = ("." + suffixName);
        return this.audioSuffix;   
    }
});
