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

const _ = imports.gettext.gettext;
const Gio = imports.gi.Gio;
const Gst = imports.gi.Gst;
const GstPbutils = imports.gi.GstPbutils;
const Mainloop = imports.mainloop;

const Application = imports.application; 
 
 const Play = new Lang.Class({
    Name: "Play",
           
    _playPipeline: function() {        
        this.play = Gst.ElementFactory.make("playbin", "play");
        this.play.set_property("uri", "file:///2013-06-2018:59:13.mp3");
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
    
    startPlaying: function() {
        this._playPipeline();
        let ret = this.play.set_state(Gst.State.PLAYING); 
                
        if (ret == Gst.StateChangeReturn.FAILURE)
            log("Unable to set the playbin to the playing state.\n"); //create return string?
    },
    
    pausePlaying: function() {
        this.play.set_state(Gst.State.PAUSED);
        //this.pipeState = PipelineStates.PAUSED;
    },
    
    stopPlaying: function() {
        let sent = this.play.send_event(Gst.Event.new_eos());
        log(sent);

    },
    
    onEndOfStream: function() { 
        this.play.set_state(Gst.State.NULL);
        log("called stop");
        //this.pipeState = PipelineStates.STOPPED;
        this.playBus.remove_signal_watch(); 
    },
        
    _onMessageReceived: function(message) {
        this.localMsg = message;
        let msg = message.type;
        log(msg);
        switch(msg) {
                    
            case Gst.MessageType.EOS:                  
                log("eos");
                this.onEndOfStream(); 
                break;
                
            case Gst.MessageType.ERROR:
                log("Error :");
                log(this.localMsg.parse_error());                
                break;
        }
    } 
});
   
