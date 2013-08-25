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
 
 //GST_DEBUG=4 ./src/gnome-sound-recorder

imports.gi.versions.Gst = '1.0';

const _ = imports.gettext.gettext;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gst = imports.gi.Gst;
const GstAudio = imports.gi.GstAudio;
const GstPbutils = imports.gi.GstPbutils;
const Mainloop = imports.mainloop;
const Signals = imports.signals;

const Application = imports.application;
const AudioProfile = imports.audioProfile;

const PipelineStates = {
    PLAYING: 0,
    PAUSED: 1,
    STOPPED: 2
};

const _TENTH_SEC = 100000000;
   
const Record = new Lang.Class({
    Name: "Record",
    
    _recordPipeline: function() {
        this.baseTime = 0;
        this._view = Application.view; 
        this._buildFileName = new BuildFileName();
        this.initialFileName = this._buildFileName.buildInitialFilename();
        log(this.initialFileName);
        this.dateTime = this._buildFileName.getOrigin();
        this.gstreamerDateTime = Gst.DateTime.new_from_g_date_time(this.dateTime);
        
        if (this.initialFileName == -1) {
            log('Unable to create Recordings directory');
            this.onEndOfStream();
        }
                      
        this.pipeline = new Gst.Pipeline({ name: 'pipe' });
        this.srcElement = Gst.ElementFactory.make("pulsesrc", "srcElement");
        
        if(this.srcElement == null) {
          let sourceError = "Your audio capture settings are invalid.";
          log(sourceError);
          this.onEndOfStream();
        }
        
        this.pipeline.add(this.srcElement);
        this.clock = this.pipeline.get_clock();
        this.recordBus = this.pipeline.get_bus();
        this.recordBus.add_signal_watch();
        this.recordBus.connect("message", Lang.bind(this,
            function(recordBus, message) {
            
                if (message != null) {
                    this._onMessageReceived(message);
                }
            }));
        this.level = Gst.ElementFactory.make("level", "level");
        log(this.level);
        this.pipeline.add(this.level);  
        this.ebin = Gst.ElementFactory.make("encodebin", "ebin");
        this.ebin.connect("element-added", Lang.bind(this,
            function(ebin, element) {
                let factory = element.get_factory();
                
                if (factory != null) {
                        this.hasTagSetter = factory.has_interface("GstTagSetter");
                        log("has interface");
                        if (this.hasTagSetter == true) {
                            this.taglist = Gst.TagList.new_empty();
                            this.taglist.add_value(Gst.TagMergeMode.APPEND, Gst.TAG_APPLICATION_NAME, _("Sound Recorder"));
                            element.merge_tags(this.taglist, Gst.TagMergeMode.REPLACE);
                            // set title only when the user renames the file
                            //this.taglist.add_value(Gst.TagMergeMode.APPEND, Gst.TAG_TITLE, this.initialFileName.get_basename());
                            //element.merge_tags(this.taglist, Gst.TagMergeMode.REPLACE);
                            this.taglist.add_value(Gst.TagMergeMode.APPEND, Gst.TAG_DATE_TIME, this.gstreamerDateTime);
                            element.merge_tags(this.taglist, Gst.TagMergeMode.REPLACE);
                    }
                }
            }));
        let ebinProfile = this.ebin.set_property("profile", this._mediaProfile);
        this.pipeline.add(this.ebin);
        let srcpad = this.ebin.get_static_pad("src");
        this.giosink = Gst.ElementFactory.make("giosink", "giosink");
        this.giosink.set_property("file", this.initialFileName);
        this.pipeline.add(this.giosink);
        
        if (!this.pipeline || !this.giosink) {
            log ("Not all elements could be created.\n");
            this.onEndOfStream();
        }
            
        let srcLink = this.srcElement.link(this.level);
        let levelLink = this.level.link(this.ebin);
        let ebinLink = this.ebin.link(this.giosink);
        
        if (!srcLink || !levelLink || !ebinLink) {
            log("Not all of the elements were linked");
            this.onEndOfStream();
        }
    },
                   
    _updateTime: function() {          
        let time = this.pipeline.query_position(Gst.Format.TIME, null)[1]/Gst.SECOND;
        
        if (time >= 0) {
            this._view.setLabel(time, 0);            
        }
        
        this.absoluteTime = this.clock.get_time();
        
        if (this.baseTime == 0)
            this.baseTime = this.absoluteTime;
            log("base time " + this.baseTime);
 
        this.runTime = this.absoluteTime- this.baseTime;
        log(this.runTime);
        log("current clocktime " + this.absoluteTime);
        let approxTime = Math.round(this.runTime/_TENTH_SEC);
        log("approx" + approxTime);
        log("peakruntime" + this.peak);
        Application.wave._drawEvent(approxTime, this.peak);
        
        return true;
    },
       
    startRecording: function(activeProfile) {
        this._activeProfile = activeProfile;
        this._audioProfile = Application.audioProfile;
        this._mediaProfile = this._audioProfile.mediaProfile();
        
        if (this._mediaProfile == -1) {
            log("No Media Profile was set.");
        }
        
        if (!this.pipeline || this.pipeState == PipelineStates.STOPPED )
            this._recordPipeline();
            
        let ret = this.pipeline.set_state(Gst.State.PLAYING);
        this.pipeState = PipelineStates.PLAYING;
        
        if (ret == Gst.StateChangeReturn.FAILURE) {
            log("Unable to set the pipeline to the recording state.\n"); //create return string?
            this.onEndOfStream();  
        }
            
        if (!this.timeout) {
            this.timeout = GLib.timeout_add(GLib.PRIORITY_DEFAULT, Application._SEC_TIMEOUT, Lang.bind(this, this._updateTime));    
        }
    },

    stopRecording: function() {
        let sent = this.pipeline.send_event(Gst.Event.new_eos());
        log(sent);
        
        if (this.timeout) {
            GLib.source_remove(this.timeout);
            this.timeout = null;
        }
        Application.wave.endDrawing();
    },
    
    onEndOfStream: function() {
        this.srcElement.set_state(Gst.State.NULL); 
        this.srcElement.get_state(null, null, -1); 
        this.pipeline.set_state(Gst.State.NULL);
        log("called stop");
        this.pipeState = PipelineStates.STOPPED;
        this.recordBus.remove_signal_watch();
        this._updateTime(); 
    },
        
    _onMessageReceived: function(message) {
        this.localMsg = message;
        let msg = message.type;
        //log(msg);
        switch(msg) {
            
            case Gst.MessageType.ELEMENT:
                log("elem");
                if (GstPbutils.is_missing_plugin_message(this.localMsg)) { //buggy?
                    let detail = GstPbutils.missing_plugin_message_get_installer_detail(this.localMsg);
                       
                    if (detail != null)
                        log(detail);
                                                   
                    let description = GstPbutils.missing_plugin_message_get_description(this.localMsg);
                   
                    if (description != null)
                        log(description);
                        
                    this.stopRecording();
                }
                
                let s = message.get_structure();
                    if (s) {
                        if (s.has_name("level")) {
                            log("level");
                            let p = null;
                            let peakVal = 0;
                            let st = s.get_value("timestamp");
                            log(st);
                            let dur = s.get_value("duration");
                            log(dur);
                            let runTime = s.get_value("running-time");
                            log(runTime);
                            peakVal = s.get_value("peak");
                            log("peakVal" + peakVal);
                            if (peakVal) {
                                let val = peakVal.get_nth(0);
                                let valBase = (val / 20);
                                let value = Math.pow(10, valBase);
                                this.peak = value/3.375;
                                log("record wave height" + value);                                
                            }                           
                        }
                    }
                break;
                    
            case Gst.MessageType.EOS:                  
                log("eos");
                this.onEndOfStream(); 
                break;
                                        
            case Gst.MessageType.ERROR:
                log("error");
                let errorMessage = msg.parse_error();
                log(errorMessage);                  
                break;
        }
    },
    
    setVolume: function(value) {
        let level = this.srcElement.convert_volume(GstAudio.StreamVolumeFormat.LINEAR, GstAudio.StreamVolumeFormat.CUBIC, value);
        log(level);
        this.srcElement.set_volume(GstAudio.StreamVolumeFormat.CUBIC, level);
    } 
});

const BuildFileName = new Lang.Class({ // move this to fileUtil.js
    Name: 'BuildFileName',

    buildPath: function() {
        let initialFileName = [];
        initialFileName.push(GLib.get_home_dir());
        initialFileName.push(_("Recordings"));
        
        return initialFileName;
    },
    
    ensureDirectory: function(name) {
        log(name);
        this._name = name;
        log(this._name);       
        let dirName = GLib.build_filenamev(this._name);
        let namedDir = GLib.mkdir_with_parents(dirName, 0775);
        log(namedDir);
    },
    
    buildInitialFilename: function() {
        let fileExtensionName = Application.audioProfile.fileExtensionReturner();
        let dir = this.buildPath();
        let prefix = _("Recording ");   
        this.dateTime = GLib.DateTime.new_now_local();
        let dateTimeString = this.dateTime.format(_("%Y-%m-%d %H:%M:%S")); 
        
        let extension = fileExtensionName;
        dir.push(prefix + dateTimeString + extension);
        // Use GLib.build_filenamev to work around missing vararg functions.
        this.title = GLib.build_filenamev(dir);
        let file = Gio.file_new_for_path(this.title);
        log(file);
        return file;
    },
    
    getTitle: function() {
        return this.title;
    },
    
    getOrigin: function() {
        return this.dateTime;
    }    
});


