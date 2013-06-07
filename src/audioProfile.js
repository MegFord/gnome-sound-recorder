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

const audioContainerProfileMap = {
    "application/ogg": 0, // 'ogg'
    "application/x-id3": 1 // 'mp3'
};

const audioSuffixMap = { 
    ".ogg": 0, 
    ".opus": 1      
 };
 
const noContainerSuffixMap = {
         ".mp3": 0, 
         ".aac": 1, // mp4
         ".flac": 2 
};

const audioCodecMap = { 
    "audio/mpeg,mpegversion=4": 0, // AAC
    "audio/x-flac": 1,      
    "audio/mpeg, mpegversion=(int)1, layer=(int)3": 2,
    "audio/x-opus": 3, 
    "audio/x-vorbis": 4
};

const AudioProfile = new Lang.Class({
    Name: 'AudioProfile',

    mediaProfile: function(codecProfile){
        let codecArr = [];
        this.codecProfile = codecProfile; 
        codecArr = this._assignProfile(this.codecProfile);
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
    
    _assignProfile: function(profileName){
        this.profileName = profileName;
        let values = [];
        
        if (profileName == null) {
           log("Failed to get output format"); //set error for user
        } else {
            //switch (this.profileName) {
            //case 
            //values.push({ name: value, role: this._getUserRoleString(role) });
        }
    }
});
