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
 
imports.gi.versions.Gst = '1.0';
const Gst = imports.gi.Gst;
const Mainloop = imports.mainloop;

const PipelineStates = {
    PLAYING: 0,
    PAUSED: 1
};

const record = new Lang.Class({
    Name: "Record",
    
    _recordPipeline: function() {
        Gst.init(null, 0);        
        this.pipeline = new Gst.Pipeline({ name: 'pipe' });
        let source = Gst.ElementFactory.make("alsasrc", "source");
        this.pipeline.add(source);
        let converter = Gst.ElementFactory.make('audioconvert', 'converter');
        this.pipeline.add(converter);
        let encoder = Gst.ElementFactory.make('vorbisenc', 'encoder');
        this.pipeline.add(encoder);
        let ogg = Gst.ElementFactory.make('oggmux', 'ogg');
        this.pipeline.add(ogg);
        let filesink = Gst.ElementFactory.make("filesink", "filesink");
        filesink.set_property("location", "sample.ogg");
        this.pipeline.add(filesink);
        source.link(converter);
        converter.link(encoder);
        encoder.link(ogg);
        ogg.link(filesink);        
    },
    
     _startRecording: function() {
        this._recordPipeline();
        this.pipeline.set_state(Gst.State.PLAYING);       
    },
    
    _pauseRecording: function() {
        

    },
    
    _stopRecording: function() {
        this.pipeline.set_state(Gst.State.NULL);
    }
});

