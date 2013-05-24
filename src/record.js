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
const _ = imports.gettext.gettext;

const PipelineStates = {
    PLAYING: 0,
    PAUSED: 1,
    STOPPED: 2
};

const DefaultFileName = {
    HOME_DIR_NAME: 0,
    DEFAULT_DIR: 1,
    EDITED_ORIGIN: 2
};   

const record = new Lang.Class({
    Name: "Record",
    
    _recordPipeline: function() {
        this._buildFileName = new buildFileName();
        this.defaultFileName = this._buildFileName.buildDefaultFilename();
        Gst.init(null, 0);        
        this.pipeline = new Gst.Pipeline({ name: 'pipe' });
        let source = Gst.ElementFactory.make("gconfaudiosrc", "source"); 
        
        if(source == null) {
          let sourceError = "Your audio capture settings are invalid. Please correct them"; //replace with link to system settings 
        }
        
        this.pipeline.add(source);
        let sampler = Gst.ElementFactory.make('audioconvert', 'sampler');
        this.pipeline.add(sampler);
        let encoder = Gst.ElementFactory.make('vorbisenc', 'encoder');
        this.pipeline.add(encoder);
        let ogg = Gst.ElementFactory.make('oggmux', 'ogg');
        this.pipeline.add(ogg);
        let filesink = Gst.ElementFactory.make("filesink", "filesink");
        filesink.set_property("location", this.defaultFileName);
        this.pipeline.add(filesink);
        
        if (!this.pipeline || !sampler || !encoder || !ogg || !filesink) //test this
            log ("Not all elements could be created.\n");
        
        source.link(sampler);
        sampler.link(encoder);
        encoder.link(ogg);
        ogg.link(filesink);
        //pipeline.merge_tags
    },
    
    startRecording: function() {
        if (!this.pipeline || this.pipeState == PipelineStates.STOPPED ) {
            this._recordPipeline();
        }
        
        let ret = this.pipeline.set_state(Gst.State.PLAYING);
        this.pipeState = PipelineStates.PLAYING;
        if (ret == Gst.StateChangeReturn.FAILURE) {
            log("Unable to set the pipeline to the recording state.\n"); //create return string?
        } 
    },
    
    pauseRecording: function() {
        this.pipeline.set_state(Gst.State.PAUSED);
        this.pipeState = PipelineStates.PAUSED;   
    },
    
    stopRecording: function() {
        this.pipeline.set_state(Gst.State.NULL);
        log("called stop");
        this.pipeState = PipelineStates.STOPPED;
        this.pipeline.set_locked_state(true);
    }
    
    // need to create directory /Recordings during build
});

const buildFileName = new Lang.Class({
    Name: 'BuildFileName',

      buildDefaultFilename: function() {
        let defaultFileName = [];
        defaultFileName.push(GLib.get_home_dir());
        defaultFileName.push(_("Recordings"));
        let dirName = GLib.build_filenamev(defaultFileName);
        let namedDir = GLib.mkdir_with_parents(dirName, 0775);
        let dateTimeString = GLib.DateTime.new_now_local();
        let origin = dateTimeString.format("%Y-%m-%d %H:%M:%S");
        let extension = _(".ogg");
        defaultFileName.push(origin + extension);                
        log(namedDir);        
        // Use GLib.build_filenamev to work around missing vararg functions.
        let name = GLib.build_filenamev(defaultFileName);
        log(name);
        return name;                       
    }
});

