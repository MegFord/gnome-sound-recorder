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

const Application = imports.application;

const containerProfileMap = {
    OGG: "application/ogg", 
    MP3: "application/x-id3" 
};

const audioCodecMap = { 
    MP4: "audio/mpeg,mpegversion=4", // AAC
    FLAC: "audio/x-flac",      
    MP3: "audio/mpeg, mpegversion=(int)1, layer=(int)3",
    OGG_OPUS: "audio/x-opus", 
    OGG_VORBIS: "audio/x-vorbis"
};

const audioSuffixMap = { 
    OGG_VORBIS: ".ogg", 
    OGG_OPUS: ".opus"      
 };
 
const noContainerSuffixMap = {
    FLAC: ".flac"
    MP3: ".mp3", 
    MP4: ".aac", // mp4 
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

    mediaProfile: function(){
        let codecArr = [];
        this.codecProfile = codecProfile; 
        let struct = Gst.Structure.new_empty("application/ogg");
        let caps = Gst.Caps.new_empty();
        caps.append_structure(struct);
        let containerProfile = GstPbutils.EncodingContainerProfile.new("ogg", null, caps, null);
        let audioStruct = Gst.Structure.new_empty("audio/x-vorbis");
        let audioCaps = Gst.Caps.new_empty();
        audioCaps.append_structure(audioStruct);
        let encodingProfile = GstPbutils.EncodingAudioProfile.new(audioCaps, null, null, 1);
        containerProfile.add_profile(encodingProfile);
        return containerProfile;    
    },
    
    assignProfile: function(profileName){
        this.profileName = profileName;
        this.values = [];
        
        if (profileName == null) {
           log("Failed to get output format"); //set error for user
        } else {
            switch(this.profileName) {
                case comboBoxMap.OGG_VORBIS:
                    this.values.push({ containerProfileMap.OGG, audioCodecMap.OGG_VORBIS, audioSuffixMap.OGG_VORBIS });
                    break;
                case comboBoxMap.OGG_OPUS:
                    this.values.push({ containerProfileMap.OGG, audioCodecMap.OGG_OPUS, audioSuffixMap.OGG_OPUS });
                    break;
                case comboBoxMap.FLAC:
                    this.values.push({ audioCodecMap.FLAC, audioSuffixMap.FLAC });
                    break;
                case comboBoxMap.MP3:
                    this.values.push({ audioCodecMap.MP3, audioCodecMap.MP3, audioSuffixMap.MP3 });
                    break;
                case comboBoxMap.MP4:
                    this.values.push({ audioCodecMap.MP4, audioSuffixMap.MP4 });
                    break;
                default:
                    break;
            }
        }
    }
});
