/*
* Copyright 2013 Meg Ford
* This library is free software; you can redistribute it and/or
* modify it under the terms of the GNU Library General Public
* License as published by the Free Software Foundation; either
* version 2 of the License, or (at your option) any later version.
*
* This library is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
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

const MainWindow = imports.mainWindow;

const peaks = [];
const INTERVAL = 100000000;
const pauseVal = 10;

const WaveType = {
    RECORD: 0,
    PLAY: 1
};

const WaveForm = new Lang.Class({
    Name: 'WaveForm',

    _init: function(grid, file) {
        this._grid = grid;
        
        if (file) {
            this.waveType = WaveType.PLAY;
            this.file = file;
            this.duration = this.file.duration;
            this._uri = this.file.uri;
        } else {
          this.waveType = WaveType.RECORD;
        }  
        
        this.count = 0;
        this.tick = 0;
        this.drawing = Gtk.DrawingArea.new();
        if (this.waveType == WaveType.RECORD) {
            let gridWidth = MainWindow.groupGrid.get_allocated_width();
            log("gridWidth " + gridWidth);
            let drawingWidth = gridWidth * 0.75;
            this.drawing.set_size_request(drawingWidth, 36);
            this._grid.attach(this.drawing, 2, 0, 3, 2);
        } else {
            this.drawing.set_size_request(200, 36);
            this._grid.add(this.drawing);
        }

        this.drawing.connect("draw", Lang.bind(this, this.fillSurface));
        this.drawing.show_all();
        this.drawing.get_style_context().add_class('background');
        this._grid.show_all();
        
        if (this.waveType == WaveType.PLAY) { 
            this._launchPipeline();            
            this.startGeneration();
        }
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
                            let peakVal = 0;
                            let st = s.get_value("timestamp");
                            log(st);
                            let dur = s.get_value("duration");
                            log(dur);
                            let runTime = s.get_value("running-time");
                            log(runTime);
                            peakVal = s.get_value("peak");
                
                            if (peakVal) {
                                let val = peakVal.get_nth(0);
                                let valBase = (val / 20);
                                let value = Math.pow(10, valBase);
                                let peaknumber = value/3.375;
                                log("wave height" + value);
                                peaks.push(peaknumber);
                            }                           
                        }
                    }
                log("length of the peaks array" + peaks.length);

                if (peaks.length == this.playTime) {
                    this.pipeline.set_state(Gst.State.PAUSED);
                    log("pause value ");
                    
                }
                
                if (peaks.length == pauseVal) {
                    this.pipeline.set_state(Gst.State.PAUSED);
                    log("pause value equals " + peaks.length);
                }                                      
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
    },
                
    fillSurface: function(drawing, cr) {
        if (this.waveType == WaveType.PLAY) {
            log("fill surface error" + this.waveType);
            if (peaks.length != this.playTime) { 
                this.pipeline.set_state(Gst.State.PLAYING);
                log("continue drawing " + peaks.length);
            }
        }
        
        let w = this.drawing.get_allocated_width();
        log("w " + w);
        let h = this.drawing.get_allocated_height();
        let length = this.nSamples;
        log("length " + this.nSamples);
        let waveheight = h;
        let pixelsPerSample = w/40;
        log("pixelsPerSample " + pixelsPerSample);
        let idx;
        let gradient = new Cairo.LinearGradient(0, 0, this.tick * pixelsPerSample, peaks[idx] * waveheight);
        gradient.addColorStopRGBA(0.75, 0.0, 0.72, 0.64, 0.35);       
        gradient.addColorStopRGBA(0.0, 0.2, 0.54, 0.47, 0.22);
        cr.setLineWidth(1);
        cr.setSourceRGBA(0.0, 185, 161, 255);
        cr.moveTo(0, h);
                  
        for(let i = 0; i <= this.tick; i++) {       
                    
            if (this.tick >= 40 && peaks[idx] != null) {
                idx = this.count + i + 1;
                log("value of the index for peaks " + idx);
            } else {
                idx = i;
            }
            
                if (peaks[idx] != null) {
                cr.lineTo(i * pixelsPerSample, peaks[idx] * waveheight);
                log("current base value for x co-ordinate " + this.tick);
                log("peak height " + peaks[idx]);
                log("array length " + peaks.length);
                log("array index value " + idx);

            } 
        }

        cr.lineTo(this.tick * pixelsPerSample, h);
        cr.closePath();
        cr.strokePreserve();
       
        cr.setSource(gradient);
	    cr.fillPreserve();
    },
    
    _drawEvent: function(playTime, recPeaks) {
        let lastTime;
        if (this.waveType == WaveType.PLAY) {
            lastTime = this.playTime;
            this.playTime = playTime;
            log("check peaks" + peaks.length);
            log("playTime time" + this.playTime);
                  
            if (peaks.length < this.playTime) {
                this.pipeline.set_state(Gst.State.PLAYING);
                log("continue drawing " + peaks.length);
            } 
                    
            if (this.tick < this.playTime) {//&& this.tick < this.nSamples) {  should be somewhere else
                this.tick += 1;
                this.count += 1;
                log("tick value" + this.tick);
            }
        
            if (lastTime != this.playTime) {
                this.drawing.queue_draw();
                log("drawing queued");
            }
        } else {
            peaks.push(recPeaks);
            lastTime = this.recordTime;
            this.recordTime = playTime;
            log("rec check peaks" + peaks.length);
            log("recordTime time" + this.recordTime);
                  
            if (peaks.length < this.recordTime) {
                log("error");
            } 
                    
            if (this.tick < this.recordTime) {//&& this.tick < this.nSamples) { should be somewhere else
                this.tick += 1;
                this.count += 1;
                log("rec tick value" + this.tick);
            }
        
            if (lastTime != this.recordTime) {
                this.drawing.queue_draw();
                log("rec drawing queued");
            }
        }
        return true;
    },
    
    endDrawing: function() {
        let width = this._grid.get_allocated_width();
        this.tick = 0;
        this.count = 0;
        peaks.length = 0;
        this.drawing.destroy(); 
    }    
});
