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
 
imports.gi.versions.Gst = '0.10';

const Gst = imports.gi.Gst;
const Mainloop = imports.mainloop;

const BuildFileName = imports.buildFileName;

const PipelineStates = {
    PLAYING: 0,
    PAUSED: 1,
    STOPPED: 2
};

const record = new Lang.Class({
    Name: "Record",
    
    _recordPipeline: function() {
        this._buildFileName = new BuildFileName.buildFileName();
        Gst.init(null, 0);        
        this.pipeline = new Gst.Pipeline({ name: 'pipe' });
        let source = Gst.ElementFactory.make("gconfaudiosrc", "source"); //ask desrt if there is a dconf version of this.gconfaudiosrc
        if(source == null) {
          let sourceError = "Your audio capture settings are invalid. Please correct them"; //replace with link to system settings 
        }
        this.pipeline.add(source);
        let converter = Gst.ElementFactory.make('audioresample', 'converter');
        this.pipeline.add(converter);
        let sampler = Gst.ElementFactory.make('audioconvert', 'sampler');
        this.pipeline.add(sampler);
        let encoder = Gst.ElementFactory.make('vorbisenc', 'encoder');
        this.pipeline.add(encoder);
        let ogg = Gst.ElementFactory.make('oggmux', 'ogg');
        this.pipeline.add(ogg);
        let filesink = Gst.ElementFactory.make("filesink", "filesink");
        filesink.set_property("location", "sample.ogg");
        this.pipeline.add(filesink);
        if (!this.pipeline || !converter || !sampler || !encoder || !ogg || !filesink) { //test this
        log ("Not all elements could be created.\n");
        }
        
        source.link(converter);
        converter.link(sampler);
        sampler.link(encoder);
        encoder.link(ogg);
        ogg.link(filesink);        
    },
    
     _startRecording: function() {
        this._recordPipeline();
        let ret = this.pipeline.set_state(Gst.State.PLAYING); 
        if (ret == Gst.StateChangeReturn.FAILURE) {
            log("Unable to set the pipeline to the playing state.\n"); //create return string?
        } 
    },
    
    _pauseRecording: function() {
     this.pipeline.set_state(Gst.State.PAUSED);   
    },
    
    _stopRecording: function() {
        this.pipeline.set_state(Gst.State.NULL);
        this.pipeline.set_locked_state(true);
        this._buildDefaultFilename();
    },
    
    _buildDefaultFilename: function() {
    // need to create directory /Recordings during build
        this._buildFileName._expandInitialTilde();//_buildDefaultFilename();
    }
});

