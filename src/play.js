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

const Application = imports.application;

const PipelineStates = {
    PLAYING: 0,
    PAUSED: 1,
    STOPPED: 2
}; 
 
 const Play = new Lang.Class({
    Name: "Play",
           
    _playPipeline: function(fileName) { 
        this._view = Application.view; //needs to be re-named      
        this.play = Gst.ElementFactory.make("playbin", "play");
        this.play.set_property("file", fileName);
        this.sink = Gst.ElementFactory.make("pulsesink", "sink");
        this.play.set_property("audio-sink", this.sink);
             
        this.playBus = this.play.get_bus();
        this.playBus.add_signal_watch();
        this.playBus.connect("message", Lang.bind(this,
            function(playBus, message) {
            
                if (message != null) {
                    this._onMessageReceived(message);
                }
            }));
    },
            
    startPlaying: function(fileName) {
        this._fileName = fileName;
        if (!this.play || this.playState == PipelineStates.STOPPED )
            this._playPipeline(this._fileName);
            
        this.ret = this.play.set_state(Gst.State.PLAYING);
        this.playState = PipelineStates.PLAYING; 
                
        if (this.ret == Gst.StateChangeReturn.FAILURE) {
            log("Unable to set the playbin to the playing state.\n"); 
            this.onEndOfStream();
        }   
    },
    
    pausePlaying: function() {
        this.play.set_state(Gst.State.PAUSED);
        this.playState = PipelineStates.PAUSED;
        
        if (this.timeout) {
            this.timeout = 0;
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
                this.timeout = 0;
            }
    },
    
    onEndOfStream: function() {
        this._view.onPlayStopClicked();
    },
        
    _onMessageReceived: function(message) {
        this.localMsg = message;
        let msg = message.type;
        //log(msg);
        switch(msg) {
                    
            case Gst.MessageType.EOS:                  
                this.onEndOfStream(); 
                break;
                
            case Gst.MessageType.ERROR:
                log("Error :");
                log(this.localMsg.parse_error());                
                break;
                
            case Gst.MessageType.DURATION: 
                log("duration changed");
                break;
            
            case Gst.MessageType.ASYNC_DONE:
                log("asyncdone");
                log(this.sought);
                if (this.sought) {
                    this.play.set_state(this._lastState);                    
                    Application.view.setProgressScaleSensitive();
                }    
                this.updatePosition();
                break;
        }
    }, 
    
    getPipeStates: function() {
        return this.playState;
    },    
                       
    _updateTime: function() {          
        let time = this.play.query_position(Gst.Format.TIME, null)[1]/Gst.SECOND;
        log(time);
        this.trackDuration = this.play.query_duration(Gst.Format.TIME, null)[1];
        this.trackDurationSecs = this.trackDuration/Gst.SECOND;        
        log(this.trackDurationSecs);
        
        if (time >= 0) {
            this._view.setLabel(time, this.trackDurationSecs);           
        }
        
        return true;
    },
    
    queryPosition: function() {
        let position = 0;
        while (position == 0) {
            position = this.play.query_position(Gst.Format.TIME, null)[1]/Gst.SECOND;
        }
        
        return position;
    },
    
    updatePosition: function() {
         
        if (!this.timeout) {
            this.timeout = GLib.timeout_add(GLib.PRIORITY_DEFAULT, Application._SEC_TIMEOUT, Lang.bind(this, this._updateTime));    
        }
    },
    
    progressScaleValueChanged: function(seconds) {
        let duration = this.trackDurationSecs;
        
        if (seconds < duration) {
            this.sought = this.play.seek_simple(Gst.Format.TIME, Gst.SeekFlags.FLUSH | Gst.SeekFlags.KEY_UNIT, seconds * Gst.SECOND);
         
        } else {
            // Rewind a second back before the track end
            this.play.seek_simple(Gst.Format.TIME, Gst.SeekFlags.FLUSH | Gst.SeekFlags.KEY_UNIT, duration - Gst.SECOND);

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
        let level = this.play.convert_volume(GstAudio.StreamVolumeFormat.LINEAR, GstAudio.StreamVolumeFormat.CUBIC, value);
        this.play.set_volume(GstAudio.StreamVolumeFormat.CUBIC, level);
    }
});
   
