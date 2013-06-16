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
 
 //GST_DEBUG=5 ./src/gnome-sound-recorder
 
imports.gi.versions.Gst = '1.0';

const _ = imports.gettext.gettext;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject; 
const Gst = imports.gi.Gst;
const GstPbutils = imports.gi.GstPbutils;
//const Mainloop = imports.mainloop;
const Signals = imports.signals;

const Application = imports.application;
const AudioProfile = imports.audioProfile;

const PipelineStates = {
    PLAYING: 0,
    PAUSED: 1,
    STOPPED: 2
};
   
const Record = new Lang.Class({
    Name: "Record",
    
    recordPipeline: function() {  
        this._buildFileName = new BuildFileName();
        this.initialFileName = this._buildFileName.buildInitialFilename();
        
        if (this.initialFileName == -1) {
            log('Unable to create Recordings directory');
        } 
                      
        this.pipeline = new Gst.Pipeline({ name: 'pipe' });
        this.srcElement = Gst.ElementFactory.make("pulsesrc", "srcElement"); 
        
        if(this.srcElement == null) {
          let sourceError = "Your audio capture settings are invalid. Please correct them";
          log(sourceError); 
        }
        
        this.pipeline.add(this.srcElement);
        
        this.ebin = Gst.ElementFactory.make("encodebin", "ebin");
        
        let ebinProfile = this.ebin.set_property("profile", this._mediaProfile);

        this.pipeline.add(this.ebin);
        let srcpad = this.ebin.get_static_pad("src");
        let giosink = Gst.ElementFactory.make("giosink", "giosink");
        giosink.set_property("file", this.initialFileName);
        this.pipeline.add(giosink);
        
        if (!this.pipeline || !giosink) 
            log ("Not all elements could be created.\n");
            
        let srcLink = this.srcElement.link(this.ebin);
        let ebinLink = this.ebin.link(giosink);
        
        if (!srcLink || !ebinLink)
            log("Not all of the elements were linked"); 
    },
       
    startRecording: function(activeProfile) {
        this._activeProfile = activeProfile;
        this._audioProfile = Application.audioProfile;
        this._mediaProfile = this._audioProfile.mediaProfile();
        
        if (this._mediaProfile == -1) {
            log("No Media Profile was set."); 
        }
        
        if (!this.pipeline || this.pipeState == PipelineStates.STOPPED ) 
            this.recordPipeline();
        
        let ret = this.pipeline.set_state(Gst.State.PLAYING);
        this.pipeState = PipelineStates.PLAYING;
        
        if (ret == Gst.StateChangeReturn.FAILURE) 
            log("Unable to set the pipeline to the recording state.\n"); //create return string? 
             
        this.recordBus =this.pipeline.get_bus(); 
        this.recordBus.add_signal_watch();
        
        if (this.ebin == null) 
            log("Unable to create encodebin");
            
        this.recordBus.connect("message", (this, 
            function(recordBus, message) {
            
                if (message != null) {
                
                    if (GstPbutils.is_missing_plugin_message(message)) { 
                        let detail = GstPbutils.missing_plugin_message_get_installer_detail(message);
                        
                        if (detail != null)
                            log(detail); 
                                                   
                        let description = GstPbutils.missing_plugin_message_get_description(message);
                    
                        if (description != null)
                            log(description);
                        recordBus.remove_signal_watch();                   
                    } 
                    
                    // Deal with the other messages here 
                }
            }));
     

    //log(encoderName);                      
    this._tagWriter = new TagWriter();
    this._setTags = this._tagWriter.tagWriter(this.ebin);    
    },
    
    pauseRecording: function() {
        this.pipeline.set_state(Gst.State.PAUSED);
        this.pipeState = PipelineStates.PAUSED;   
    },
    
    stopRecording: function() {
        this.srcElement.send_event(Gst.Event.new_eos());
        this.srcElement.set_state(Gst.State.NULL); 
        this.srcElement.get_state(null, null, -1);
        this.srcElement.set_locked_state(true); 
        this.pipeline.set_state(Gst.State.NULL);
        log("called stop");
        this.pipeState = PipelineStates.STOPPED;
        //this.pipeline.set_locked_state(true);
    }
    
    // need to create directory /Recordings during build?
});

const TagWriter = new Lang.Class({
    Name: 'TagWriter',
    
    tagWriter: function(encoder) {
        let tagSetter = GObject.type_from_name("GstTagSetter");
        log(tagSetter);
        let tagWriter = encoder.get_by_interface(tagSetter);
        log(tagSetter);
          // if (tagWriter == true) {
           log("well, true");
               let taglist = Gst.TagList.new_empty();
               taglist.add_value(Gst.TagMergeMode.APPEND, Gst.TAG_APPLICATION_NAME, _("Sound Recorder"));
               encoder.merge_tags(taglist, Gst.TagMergeMode.REPLACE);
        //}        
    }
});

const BuildFileName = new Lang.Class({
    Name: 'BuildFileName',

    buildInitialFilename: function() {
        let fileExtensionName = Application.audioProfile.fileExtensionReturner();
        let initialFileName = [];
        initialFileName.push(GLib.get_home_dir());
        initialFileName.push(_("Recordings"));
        let dirName = GLib.build_filenamev(initialFileName);
        let namedDir = GLib.mkdir_with_parents(dirName, 0775);
        log(namedDir);
        log("direct create val");
        
        if (namedDir == -1)
            return namedDir;
            
        let dateTimeString = GLib.DateTime.new_now_local();
        let origin = dateTimeString.format(_("%Y-%m-%d %H:%M:%S"));
        let extension = fileExtensionName;
        initialFileName.push(origin + extension);                
        log(namedDir);        
        // Use GLib.build_filenamev to work around missing vararg functions.
        let name = GLib.build_filenamev(initialFileName);
        let file = Gio.file_new_for_path(name);
        log(file);
        return file;                      
    }
});

