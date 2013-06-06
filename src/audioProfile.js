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

const audioContainerProfileMap = {
    'ogg': "application/ogg",
    'mp3': "application/x-id3"
};

const audioSuffixMap = { 
    'OGG': ".ogg", 
    'Opus' : ".opus",     
    'MPEG4' : ".mp4"       
 };
 
const noContainerSuffixMap = {
         'audio/mpeg, mpegversion=(int)1, layer=(int)3' : ".mp3", 
         'audio/mpeg, mpegversion=(int)4, stream-format=(string)adts' : ".aac", 
         'audio/x-flac' : ".flac" 
};

const audioCodecMap = { 
    'AAC' : "audio/mpeg,mpegversion=4",
    'FLAC': "audio/x-flac",      
    'MP3': "audio/mpeg, mpegversion=(int)1, layer=(int)3",
    'Opus'  :  "audio/x-opus", 
    'Vorbis': "audio/x-vorbis",
    'WAV': "audio/x-wav"
};

const AudioProfile = new Lang.Class({
    Name: 'AudioProfile',

    mediaProfile: function(){ 
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
    }
});
