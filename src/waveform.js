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
 *
 * Author: Meg Ford <megford@gnome.org>
 */

// based on code from Pitivi 

const Cairo = imports.cairo;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject; 
const Gst = imports.gi.Gst;
const GstAudio = imports.gi.GstAudio;
const Gtk = imports.gi.Gtk;
const _ = imports.gettext.gettext;
const C_ = imports.gettext.pgettext;
const Lang = imports.lang;
const Mainloop = imports.mainloop;

const Application = imports.application;

const peaks = [];
const INTERVAL = 100000000;

const WaveForm = new Lang.Class({
    Name: 'WaveForm',

    _init: function(file, grid) {
        this.file = file;
        this.allowFill = true;
        this.count = 0;
        this.newWave = 0;
        this.tick = 0; 
        this.duration = this.file.duration;
        
        this.drawing = Gtk.DrawingArea.new();
        this.drawing.set_size_request(200, 36);
        grid.add(this.drawing);                            
        this.drawing.connect("draw", Lang.bind(this, this.fillSurface));   
        this._uri = this.file.uri;
        this.drawing.show_all();
        grid.show_all();

        this._launchPipeline();
        this.startGeneration();
    },

    _launchPipeline: function() {
        this.peaks = null;
        this.pipeline = 
            Gst.parse_launch("uridecodebin name=decode uri=" + this._uri + " ! audioconvert ! audio/x-raw,channels=1 !level name=wavelevel interval=100000000 post-messages=true ! fakesink qos=false");
        this._level = this.pipeline.get_by_name("wavelevel");
        let decode = this.pipeline.get_by_name("decode");
        let bus = this.pipeline.get_bus();
        bus.add_signal_watch();

        this.nSamples = Math.ceil(this.duration / INTERVAL);
        log("value of this.duration at pipeline launch " + this.duration);
        log("value of this.nSamples at pipeline launch " + this.nSamples);

        bus.connect("message", Lang.bind(this,
            function(bus, message) {
            
                if (message != null) {
                    this._messageCb(message);
                }
            }));
    },

    _messageCb: function(message) {
        let msg = message.type;
        
        switch(msg) {
        
            case Gst.MessageType.ELEMENT:
                let s = message.get_structure();
                    if (s) {
                        if (s.has_name("level")) {
                            let p = null;
                            this.peakVal = 0;

                            this.peakVal = s.get_value("peak");
                
                            if (this.peakVal) {
                                this.val = this.peakVal.get_nth(0);
                                log("initial value of this.val " + this.val);
                                let valBase = (this.val / 20);
                                this.val = Math.pow(10, valBase);
                                log("linear scale value of this.val " + this.val);
                                peaks.push(this.val);
                            }
                        }
                    }
                       log(peaks.length);
                log("PEAKSLENGTHELEMENT");                               
                break;
                       
            case Gst.MessageType.EOS:
                this.stopGeneration();
                break;
        }
    }, 

    startGeneration: function() {
        this.pipeline.set_state(Gst.State.PLAYING)
    },

    stopGeneration: function() {
        this.pipeline.set_state(Gst.State.NULL);
        this.timer();
        Application.play.startPlaying();
    },
                
    fillSurface: function(drawing, cr) { 
        let w = this.drawing.get_allocated_width();
        let h = this.drawing.get_allocated_height();
        let length = this.nSamples;
        log("height: " + h);
 
        cr.setLineWidth(1);
        cr.setSourceRGBA(0.0, 185, 161, 255);
        let pixelsPerSample = w/40;
        let waveheight = h/3.375;
        cr.moveTo(0, h); 
                  
        for(let i = 0; i <= this.tick; i++) {
                    
            if (this.tick >= 40 && peaks[this.newWave] != null) {
                this.newWave = this.count + i + 1;
                log("value of the index for peaks (this.newWave) " + this.newWave); 
            } else {
                this.newWave = i;
            } 
            
            if (peaks[this.newWave] != null) {
                cr.lineTo(i * pixelsPerSample, peaks[this.newWave] * waveheight);
                log("current x co-ordinate" + this.tick);
                log("peak height " + peaks[this.newWave] * waveheight);
                log("array length " + peaks.length);
                log("array index value " + this.newWave);
                /*cr.lineTo(i*5, 0);
                cr.closePath();
                log(this.tick);
                log(peaks[this.tick]*h);
                cr.fillPreserve();*/
            }
        }
        cr.strokePreserve();
        
        if (this.tick < this.nSamples) {        
            this.tick += 1;
            this.count += 1;
        }  
    },
    
    timer: function()   {
        if (!this.timeout) {
            this.timeout = GLib.timeout_add(GLib.PRIORITY_DEFAULT, Application._SEC_TIMEOUT, Lang.bind(this, 
                this._drawEvent));  
        }
    },
    
    _drawEvent: function()  {   
        this.drawing.queue_draw();
        log("drawing queued");
        return true;       
    },
    
    pauseDrawing: function() {
        if (this.timeout) {
           GLib.source_remove(this.timeout);
            this.timeout = null;
        }
    },
    
    endDrawing: function()  {
        if (this.timeout) {
            GLib.source_remove(this.timeout);
            this.timeout = null;
            log("timeout removed");
        }
        this.drawing.destroy();
    }
});

