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
 * Author: Meg Ford <megford@gnome.org>
 *
 */
 
 //./src/gnome-sound-recorder

imports.gi.versions.Gst = '1.0';

const _ = imports.gettext.gettext;
const Gio = imports.gi.Gio;
const Gst = imports.gi.Gst;
const GstAudio = imports.gi.GstAudio;
const GstPbutils = imports.gi.GstPbutils;
const Mainloop = imports.mainloop;

const MainWindow = imports.mainWindow;
const Waveform = imports.waveform;

const PipelineStates = {
    PLAYING: 0,
    PAUSED: 1,
    STOPPED: 2,
    NULL: 3
}; 

const _TENTH_SEC = 100000000;
 
 const Play = new Lang.Class({
    Name: "Play",
           
    _playPipeline: function(fileName) {
        this.baseTime = 0;
        this._fileName = this._fileToPlay;
        this.uri = GLib.filename_to_uri(this._fileName, null); 
        this.view = MainWindow.view;      
        this.play = Gst.ElementFactory.make("playbin", "play");
        this.play.set_property("uri", this.uri);
        this.sink = Gst.ElementFactory.make("pulsesink", "sink");
        this.play.set_property("audio-sink", this.sink);
        this.clock = this.play.get_clock();               
        this.playBus = this.play.get_bus();
        log(this.playBus);
        this.playBus.add_signal_watch();
        this.playBus.connect("message", Lang.bind(this,
            function(playBus, message) {
            
                if (message != null) {
                    this._onMessageReceived(message);
                }
            }));
    },
            
    startPlaying: function(fileName) {
        log("playing started");
        this._fileName = fileName;
        
        if (!this.play || this.playState == PipelineStates.STOPPED )
            this._playPipeline(this._fileName);
            
        log(this.playState);
        log("start playing");
        if (this.playState == PipelineStates.PAUSED) {
            this.updatePosition();   
        }
            
        this.ret = this.play.set_state(Gst.State.PLAYING);
        this.playState = PipelineStates.PLAYING;
                
        if (this.ret == Gst.StateChangeReturn.FAILURE) {
            log("Unable to set the playbin to the playing state.\n"); 
            this.onEndOfStream();
        } else if (this.ret == Gst.StateChangeReturn.SUCCESS) {        
            MainWindow.view.setVolume(); 
        }  
    },
    
    pausePlaying: function() {
        this.play.set_state(Gst.State.PAUSED);
        this.playState = PipelineStates.PAUSED;
        this.baseTime = this.absoluteTime;
        log("pause");
        if (this.timeout) {
            GLib.source_remove(this.timeout);
            this.timeout = null;
        }
    },
    
    stopPlaying: function() {
        if (this.playState != PipelineStates.STOPPED) {
            this.onEnd();
        }
    },
    
    onEnd: function() {
        this.play.set_state(Gst.State.NULL);
        log("called stop");
        this.playState = PipelineStates.STOPPED;
        this.playBus.remove_signal_watch();
        this._updateTime();
                                    
            if (this.timeout) {
                GLib.source_remove(this.timeout);
                this.timeout = null;
            }
        MainWindow.wave.endDrawing();
        log("DRAWING CALL END");
    },
    
    onEndOfStream: function() {
        this.view.onPlayStopClicked();
    },
        
    _onMessageReceived: function(message) {
        this.localMsg = message;
        let msg = message.type;
        log(msg);
        switch(msg) {                                               
            case Gst.MessageType.EOS:               
                this.onEndOfStream(); 
                break;
                
            case Gst.MessageType.ERROR:
                log("Error :" + message.parse_error());
                this._showErrorDialog(_("Error:" + message.parse_error()));           
                break;
                
            case Gst.MessageType.DURATION: 
                log("duration changed");
                break;
            
            case Gst.MessageType.ASYNC_DONE:
                log("asyncdone");
                log(this.sought);
                if (this.sought) {
                    this.play.set_state(this._lastState);                    
                    MainWindow.view.setProgressScaleSensitive();
                }    
                this.updatePosition();
                break; 
                
            case Gst.MessageType.CLOCK_LOST:
                this.pausePlaying();
                break;
           
            case Gst.MessageType.NEW_CLOCK:
                if (this.playState == PipelineStates.PAUSED) {
                    this.clock = this.play.get_clock();
                    this.startPlaying();
                }
                break;    
        }
    }, 
    
    getPipeStates: function() {
        return this.playState;
    },  
                       
    _updateTime: function() {          
        let time = this.play.query_position(Gst.Format.TIME, null)[1]/Gst.SECOND; 
        log(time);
        log("time");
        this.trackDuration = this.play.query_duration(Gst.Format.TIME, null)[1];
        this.trackDurationSecs = this.trackDuration/Gst.SECOND;        
        log(this.trackDurationSecs);
        
        if (time >= 0 && this.playState != PipelineStates.STOPPED) {
            log("called UPDATE");
            this.view.setLabel(time);           
        } else if (time >= 0 && this.playState == PipelineStates.STOPPED) {
            this.view.setLabel(0); 
        }
        
        this.absoluteTime = this.clock.get_time();
        
        if (this.baseTime == 0)
            this.baseTime = this.absoluteTime;
            log("base time " + this.baseTime);
 
        let runTime = this.absoluteTime- this.baseTime;
        log(runTime);
        log("current clocktime " + this.absoluteTime);
        let approxTime = Math.round(runTime/_TENTH_SEC);
        log("approx" + approxTime);
        MainWindow.wave._drawEvent(approxTime);
        
        return true;
    },
    
    queryPosition: function() { // Do I use this?
        let position = 0;
        while (position == 0) {
            position = this.play.query_position(Gst.Format.TIME, null)[1]/Gst.SECOND;
        }
        
        return position;
    },
    
    updatePosition: function() {
         
        if (!this.timeout) {
            this.timeout = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 10, Lang.bind(this, 
                this._updateTime));    
        }
    },
    
    progressScaleValueChanged: function(seconds) {
        let duration = this.trackDurationSecs;
        
        if (seconds < duration) {
            this.sought = this.play.seek_simple(Gst.Format.TIME, Gst.SeekFlags.FLUSH | Gst.SeekFlags.KEY_UNIT, seconds * Gst.SECOND);
         
        } else {
            this.play.seek_simple(Gst.Format.TIME, Gst.SeekFlags.FLUSH | Gst.SeekFlags.KEY_UNIT, duration);

        }
    },
    
    onProgressScaleConnect: function() {
        this._lastState = this.play.get_state(1)[1];
        
        if (this._lastState == Gst.State.PLAYING)
            this.play.set_state(Gst.State.PAUSED);
        
        if (this.timeout) {
            GLib.source_remove(this.timeout);
            this.timeout = null;
        }
    },
    
    setVolume: function(value) {
        this.play.set_volume(GstAudio.StreamVolumeFormat.CUBIC, value);
    },
    
    passSelected: function(selected) { //I think this is unnecessary?
        this._selected = selected;
        log(selected);
        log("SELECT");
        this._fileToPlay = MainWindow.view.loadPlay(this._selected);
    },
    
    _showErrorDialog: function(errorStr) {
        let errorDialog = new Gtk.MessageDialog ({ transient_for: this.widget,
                                                   modal: true,
                                                   destroy_with_parent: true,
                                                   buttons: Gtk.ButtonsType.OK,
                                                   message_type: Gtk.MessageType.WARNING,
                                                   text: errorStr });

        errorDialog.connect ('response', Lang.bind(this,
            function() {
                errorDialog.destroy();
            }));
        errorDialog.show();
    }
});
   
