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
    //There is no container for wav?'wav': 
    'mp3': "application/x-id3"
    // There is no container for flac (?)
};

const audioSuffixMap = {
    'FLAC': ".flac",
    'MP3': ".mp3", 
    'OGG': ".ogg",      
    'WAV': ".wav"    
 };

const audioCodecMap = { 
    'FLAC': "audio/x-flac",      
    'MP3': "audio/mpeg, mpegversion=(int)1, layer=(int)3", 
    'Vorbis': "audio/gst-elementx-vorbis",
    'WAV': "audio/x-wav"
};

const AudioProfile = new Lang.Class({
    Name: 'AudioProfile',

    mediaProfile: function(){ 
        let emptyStruct = Gst.Structure.new_empty("emptyStruct");
        emptyStruct.set_value("format", "application/ogg");
        let emptyCaps = Gst.Caps.new_empty_simple("emptyCaps");
        emptyCaps.merge_structure(emptyStruct);
        let containerProfile = new GstPbutils.EncodingContainerProfile("ogg", null, emptyCaps, null);
        this.encodingProfile = new GstPbutils.EncodingAudioProfile(Gst.Caps("audio/gst-elementx-vorbis"), null, Gst.Caps.new_any(), 0);
       // let extension = rb_gst_media_type_to_extension(mediaType);    
    }
});
