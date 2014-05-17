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
 * License along with this library; if not, see <http://www.gnu.org/licenses/>.
 *
 *  Author: Meg Ford <megford@gnome.org>
 *
 */

imports.gi.versions.Gst = '1.0';

const _ = imports.gettext.gettext;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gst = imports.gi.Gst;
const GstAudio = imports.gi.GstAudio;
const GstPbutils = imports.gi.GstPbutils;
const Pango = imports.gi.Pango;

const Mainloop = imports.mainloop;
const Signals = imports.signals;

const Application = imports.application;
const AudioProfile = imports.audioProfile;
const MainWindow = imports.mainWindow;
const Listview = imports.listview;

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
        this._view = MainWindow.view; 
        this._buildFileName = new BuildFileName();
        this.initialFileName = this._buildFileName.buildInitialFilename();
        let localDateTime = this._buildFileName.getOrigin();
        this.gstreamerDateTime = Gst.DateTime.new_from_g_date_time(localDateTime);
        
        if (this.initialFileName == -1) {
            this._showErrorDialog(_('Unable to create Recordings directory.'));
            this.onEndOfStream();
        }
                      
        this.pipeline = new Gst.Pipeline({ name: 'pipe' });
        this.srcElement = Gst.ElementFactory.make("pulsesrc", "srcElement");
        
        if(this.srcElement == null) {
          this._showErrorDialog(_('Your audio capture settings are invalid.'));
          this.onEndOfStream();
          return;
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
        this.pipeline.add(this.level);
        this.volume = Gst.ElementFactory.make("volume", "volume");
        this.pipeline.add(this.volume);  
        this.ebin = Gst.ElementFactory.make("encodebin", "ebin");
        this.ebin.connect("element-added", Lang.bind(this,
            function(ebin, element) {
                let factory = element.get_factory();
                
                if (factory != null) {
                        this.hasTagSetter = factory.has_interface("GstTagSetter");
                        if (this.hasTagSetter == true) {
                            this.taglist = Gst.TagList.new_empty();
                            this.taglist.add_value(Gst.TagMergeMode.APPEND, Gst.TAG_APPLICATION_NAME, _("Sound Recorder"));
                            element.merge_tags(this.taglist, Gst.TagMergeMode.REPLACE);
                            this.taglist.add_value(Gst.TagMergeMode.APPEND, Gst.TAG_TITLE, this.initialFileName);
                            element.merge_tags(this.taglist, Gst.TagMergeMode.REPLACE);
                            this.taglist.add_value(Gst.TagMergeMode.APPEND, Gst.TAG_DATE_TIME, this.gstreamerDateTime);
                            element.merge_tags(this.taglist, Gst.TagMergeMode.REPLACE);
                    }
                }
            }));
        this.pipeline.add(this.ebin);
        let ebinProfile = this.ebin.set_property("profile", this._mediaProfile);
        let srcpad = this.ebin.get_static_pad("src");
        this.filesink = Gst.ElementFactory.make("filesink", "filesink");
        this.filesink.set_property("location", this.initialFileName);
        this.pipeline.add(this.filesink);
        
        if (!this.pipeline || !this.filesink) {
            this._showErrorDialog(_('Not all elements could be created.'));
            this.onEndOfStream();
        }
            
        let srcLink = this.srcElement.link(this.level);
        let levelLink = this.level.link(this.volume);
        let volLink = this.volume.link(this.ebin);
        let ebinLink = this.ebin.link(this.filesink);
        
        if (!srcLink || !levelLink || !ebinLink) {
            this._showErrorDialog(_('Not all of the elements were linked'));
            this.onEndOfStream();
        }
        
        GLib.unix_signal_add(GLib.PRIORITY_DEFAULT, Application.SIGINT, Application.application.onWindowDestroy, this.pipeline);
        GLib.unix_signal_add(GLib.PRIORITY_DEFAULT, Application.SIGTERM, Application.application.onWindowDestroy, this.pipeline);
    },
                   
    _updateTime: function() {          
        let time = this.pipeline.query_position(Gst.Format.TIME, null)[1]/Gst.SECOND;
        
        if (time >= 0) {
            this._view.setLabel(time, 0);            
        }        
        
        return true;
    },
       
    startRecording: function(profile) {
        this.profile = profile;
        this._audioProfile = MainWindow.audioProfile;
        this._mediaProfile = this._audioProfile.mediaProfile();
        
        if (this._mediaProfile == -1) {
            this._showErrorDialog(_('No Media Profile was set.'));
        }
        
        if (!this.pipeline || this.pipeState == PipelineStates.STOPPED )
            this._recordPipeline();
            
        let ret = this.pipeline.set_state(Gst.State.PLAYING);
        this.pipeState = PipelineStates.PLAYING;
        
        if (ret == Gst.StateChangeReturn.FAILURE) {
            this._showErrorDialog(_('Unable to set the pipeline \n to the recording state')); 
            this._buildFileName.getTitle().delete_async(GLib.PRIORITY_DEFAULT, null, null);
        } else {        
            MainWindow.view.setVolume(); 
        }
           
        if (!this.timeout) {
            this.timeout = GLib.timeout_add(GLib.PRIORITY_DEFAULT, MainWindow._SEC_TIMEOUT, Lang.bind(this, this._updateTime));    
        }
    },

    stopRecording: function() {
        let sent = this.pipeline.send_event(Gst.Event.new_eos());
        
        if (this.timeout) {
            GLib.source_remove(this.timeout);
            this.timeout = null;
        }
         
        if (MainWindow.wave != null)    
            MainWindow.wave.endDrawing();
    },
    
    onEndOfStream: function() { 
        this.pipeline.set_state(Gst.State.NULL);
        this.pipeState = PipelineStates.STOPPED;
        if (this.recordBus) {
	        this.recordBus.remove_signal_watch();
        }
        this._updateTime(); 
    },
        
    _onMessageReceived: function(message) {
        this.localMsg = message;
        let msg = message.type;
        switch(msg) {
            
        case Gst.MessageType.ELEMENT:
            if (GstPbutils.is_missing_plugin_message(this.localMsg)) {
                let errorOne = null;
                let errorTwo = null; 
                let detail = GstPbutils.missing_plugin_message_get_installer_detail(this.localMsg);
                       
                if (detail != null)
                    errorOne = detail;
                                                   
                let description = GstPbutils.missing_plugin_message_get_description(this.localMsg);
                   
                if (description != null)
                    errorTwo = description; 
                       
                this._showErrorDialog(errorOne, errorTwo);                       
            }
                
            let s = message.get_structure();
                if (s) {
                    if (s.has_name("level")) {
                        let p = null;
                        let peakVal = 0;
                        let val = 0;
                        let st = s.get_value("timestamp");
                        let dur = s.get_value("duration");
                        let runTime = s.get_value("running-time");
                        peakVal = s.get_value("peak");
                        
                        if (peakVal) {
                            let val = peakVal.get_nth(0);
                            
                            if (val > 0)
			                    val = 0;
                            let value = Math.pow(10, val/20);
                            this.peak = value;
                            
                            this.absoluteTime = this.clock.get_time();

                            if (this.baseTime == 0)
                                this.baseTime = this.absoluteTime;
 
                            this.runTime = this.absoluteTime- this.baseTime;
                            let approxTime = Math.round(this.runTime/_TENTH_SEC);
                            MainWindow.wave._drawEvent(approxTime, this.peak);
                            }                          
                        }
                    }
            break;
                    
        case Gst.MessageType.EOS:                  
            this.onEndOfStream(); 
            break;
            
        case Gst.MessageType.WARNING:               
            let warningMessage = message.parse_warning()[0];
            log(warningMessage.toString()); 
            break;
                                        
        case Gst.MessageType.ERROR:
            let errorMessage = message.parse_error();
            this._showErrorDialog(errorMessage.toString()); 
            this.pipeline.set_state(Gst.State.NULL);               
            break;
        }
    },
    
    setVolume: function(value) {
        if (this.volume) {
            this.volume.set_volume(GstAudio.StreamVolumeFormat.CUBIC, value);
        }
    },
    
    _showErrorDialog: function(errorStrOne, errorStrTwo) {
        let errorDialog = new Gtk.MessageDialog ({ modal: true,
                                                   destroy_with_parent: true,
                                                   buttons: Gtk.ButtonsType.OK,
                                                   message_type: Gtk.MessageType.WARNING });
        if (errorStrOne != null) {
            errorDialog.set_property('text', errorStrOne);
        }
         
        if (errorStrTwo != null)
            errorDialog.set_property('secondary-text', errorStrTwo);
            
        errorDialog.set_transient_for(Gio.Application.get_default().get_active_window());
        errorDialog.connect('response', Lang.bind(this,
            function() {
                errorDialog.destroy();
                MainWindow.view.onRecordStopClicked();
                this.onEndOfStream();
            }));
        errorDialog.show();
    } 
});

const BuildFileName = new Lang.Class({ 
    Name: 'BuildFileName',

    buildInitialFilename: function() {
        let fileExtensionName = MainWindow.audioProfile.fileExtensionReturner();
        let dir = Gio.Application.get_default().saveDir;
        this.dateTime = GLib.DateTime.new_now_local();
        this.clipNumber = Listview.allFilesInfo.length + 1;
        this.clipNumberString = this.clipNumber.toString();
        /* Translators: ""Clip %d"" is the default name assigned to a file created
            by the application (for example, "Clip 1"). */
        let clipName = _("Clip %d").format(this.clipNumberString);
        this.clip = dir.get_child_for_display_name(clipName);
        let file = this.clip.get_path();
        return file;
    },
    
    getTitle: function() {
        return this.clip;
    },
    
    getOrigin: function() {
        return this.dateTime;
    } 
});


