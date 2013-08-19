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
        this.count = 0;
        this.newWave = 0;
        this.tick = 0; 
        this.duration = this.file.duration;
        
        this.drawing = Gtk.DrawingArea.new();
        this.drawing.set_size_request(200, 36);
        grid.add(this.drawing);                            
        this.drawing.connect("draw",  Lang.bind(this, this.fillSurface));   
        this._uri = this.file.uri;
        this.drawing.show_all();
        grid.show_all();

        this._launchPipeline();
        this.startGeneration();
    },

    _launchPipeline: function() {
        this.peaks = null;
        this.pipeline = Gst.parse_launch("uridecodebin name=decode uri=" + this._uri + " ! audioconvert ! level name=wavelevel interval= 100000000 post-messages=true ! fakesink qos=false");
        this._level = this.pipeline.get_by_name("wavelevel");
        let decode = this.pipeline.get_by_name("decode");
        let bus = this.pipeline.get_bus();
        bus.add_signal_watch();

        this.nSamples = Math.ceil(this.duration / INTERVAL);
        log(this.duration);
        log(this.nSamples);
        log("NSAMPLES");
        bus.connect("message", Lang.bind(this,
            function(bus, message) {
            
                if (message != null) {
                    this._messageCb(message);
                }
            }));
    },

    _messageCb: function(message) {
        if (message.src == this._level) {
            let s = message.get_structure();
            let p = null;
            this.peakVal = 0;
            
            if (s) {
                this.peakVal = s.get_value("peak");
                
                if (this.peakVal) {
                    this.val = this.peakVal.get_nth(0);
                    log(this.val);
                    log("this.val");
                    let valBase =  (this.val / 20);
                    this.val = Math.pow(10, valBase);
                    log(this.val);
                    peaks.push(this.val);                                
               }  
            }
        }        
        if (message.type == Gst.MessageType.EOS)
            this.stopGeneration();
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
        log(h);
 
        cr.setLineWidth(1);
        cr.setSourceRGBA(0.0, 185, 161, 255);
        let pixelsPerSample = w/40;
        let waveheight = h/3.375;
        cr.moveTo(0, 100);      
                   
        for(let i = 0; i <= this.tick; i++) {
                    
            if (this.tick >= 40 && peaks[this.newWave] != null) {
                this.newWave = this.count + i + 1;
                log(this.newWave);
                log("NEWWAVE"); 
            } else {
                this.newWave = i;
            }  
            if (peaks[this.newWave] != null) {
            cr.lineTo(i * pixelsPerSample, peaks[this.newWave] * waveheight);
            cr.strokePreserve();
            log("CALL");
            log(this.tick);
            log(peaks[this.newWave] * waveheight);
            log(peaks.length);
            log("PEAKSLENGTH");
            /*cr.lineTo(i*5, 0);
            cr.closePath();
            log(this.tick);
            log(peaks[this.tick]*h);
            cr.fillPreserve();*/
            }
        }
        if (this.tick < this.nSamples) {        
            this.tick += 1;
            this.count += 1;
        }       
    },
    
    timer: function()   {
        if (!this.timeout) {
            this.timeout = GLib.timeout_add(GLib.PRIORITY_DEFAULT, Application._SEC_TIMEOUT, Lang.bind(this, this._drawEvent));
            log("tell");    
        }
    },
    
    _drawEvent: function()  {     
        this.drawing.queue_draw();
        log("drqueue");
        return true;       
    },
    
    endDrawing: function()  {
        if (this.timeout) {
            GLib.source_remove(this.timeout);
            this.timeout = null;
            log("timeout removed");
        }
    },

    nsToPixel: function(duration)  { 
        if (duration == Gst.CLOCK_TIME_NONE)
            return 0;
        return Math.floor(duration / Gst.SECOND);
    }
});

