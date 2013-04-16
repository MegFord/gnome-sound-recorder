// -*- Mode: js; indent-tabs-mode: nil; c-basic-offset: 4; tab-width: 4 -*-
//
// Copyright (c) 2013 Giovanni Campagna <scampa.giovanni@gmail.com>
//
// Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//   * Redistributions of source code must retain the above copyright
//     notice, this list of conditions and the following disclaimer.
//   * Redistributions in binary form must reproduce the above copyright
//     notice, this list of conditions and the following disclaimer in the
//     documentation and/or other materials provided with the distribution.
//   * Neither the name of the GNOME Foundation nor the
//     names of its contributors may be used to endorse or promote products
//     derived from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
// ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
// WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
// DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER BE LIABLE FOR ANY
// DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
// (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
// LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
// ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
// SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
imports.gi.versions.Gst = '0.10';

const Gst = imports.gi.Gst;

const Record = imports.record;

const Application = new Lang.Class({
    Name: 'Application',
    Extends: Gtk.ApplicationWindow,

    _init: function(params) {
        params = Params.fill(params, { title: GLib.get_application_name(),
                                       default_width: 640,
                                       default_height: 480 });
        this.parent(params);

        let grid = new Gtk.Grid({ orientation: Gtk.Orientation.VERTICAL,
                                  halign: Gtk.Align.CENTER });
        let header = new Gd.HeaderBar({ title: _(""),
                                        hexpand: true });
        //header.get_style_context().add_class("recorder-topbar");

        this._recorderButton = new Gtk.Button({ label: "Recorder",
                                                hexpand: true });
        //this._recorderButton.get_style_context().add_class("button");
        header.pack_start(this._recorderButton);
        this._playerButton = new Gtk.Button({ label: "Player",
                                              hexpand: true });
        //this._playerButton.get_style_context().add_class("button");
        header.pack_start(this._playerButton);
        grid.attach(header, 0, 0, 2, 2);

        this._view = new MainView();
        this._view.visible_child_name = (Math.random() <= 0.5) ? 'one' : 'two';
        grid.add(this._view);
        this._recorderButton.connect('clicked', Lang.bind(this, function(){
            this._view.visible_child_name = 'two';}));
            
        this._defineThemes();

        this.add(grid);
        grid.show_all();
    },
       
    _defineThemes : function() {
        let settings = Gtk.Settings.get_default();
        settings.gtk_application_prefer_dark_theme = true;
    }
});

const MainView = new Lang.Class({
    Name: 'MainView',
    Extends: Gd.Stack,

    _init: function(params) {
        params = Params.fill(params, { hexpand: true,
                                       vexpand: true });
        this.parent(params);

        let one = this._addPage('one');
            this.visible_child_name = 'two';

        let two = this._addPageTwo('two');
            this.visible_child_name = 'one';
    },

    _addPage: function(name) {
        let recorder = Gtk.Image.new_from_icon_name("audio-input-microphone-symbolic", Gtk.IconSize.DIALOG);

        let grid = new Gtk.Grid({ orientation: Gtk.Orientation.VERTICAL,
                                  halign: Gtk.Align.CENTER,
                                  valign: Gtk.Align.CENTER,
                                  column_homogeneous: true });            
        grid.add(recorder);
        this.add_named(grid, name);
    },

    _addPageTwo: function(name) {
        this._record = new Record.record();
        this.eventbox = new Gtk.EventBox();
        //this.eventbox.get_style_context().add_class ("recorder-player");
        let grid = new Gtk.Grid({ orientation: Gtk.Orientation.HORIZONTAL,
                                  halign: Gtk.Align.CENTER,
                                  valign: Gtk.Align.CENTER,
                                  column_homogeneous: true,
                                  column_spacing: 15 });
        this.eventbox.add(grid);        

        let toolbarStart = new Gtk.Box({ orientation : Gtk.Orientation.HORIZONTAL, spacing : 0 });
        toolbarStart.get_style_context().add_class(Gtk.STYLE_CLASS_LINKED);
        grid.attach(toolbarStart, 20, 0, 2, 1);
        
        this.stopButton = new Gtk.Button();
        this.stopButton.set_image(Gtk.Image.new_from_icon_name("media-playback-stop-symbolic", Gtk.IconSize.BUTTON));
        this.stopButton.connect("clicked", Lang.bind(this, this._onStopClicked));
        toolbarStart.pack_end(this.stopButton, true, true, 0);
        
        this.recordButton = new RecordPauseButton();
        this.recordButton.connect("clicked", Lang.bind(this, this._onRecordPauseToggled));
        toolbarStart.pack_end(this.recordButton, false, true, 0);

        this.add_named(this.eventbox, name);
    },
    
    _onRecordPauseToggled: function() {
        if (this.recordButton.get_active()) {
            this.recordButton.set_image(this.recordButton.pauseImage);
            this._record._startRecording(); 
        }
        else {
            this.recordButton.set_image(this.recordButton.recordImage);
            this._record._pauseRecording();            
        }
    },
    
    _onStopClicked: function() {
        this.recordButton.set_active(false);
        this._record._stopRecording();
    }     
});
    const RecordPauseButton = new Lang.Class({
    Name: "RecordPauseButton",
    Extends: Gtk.ToggleButton,
    
    _init: function() {
        this.recordImage = Gtk.Image.new_from_icon_name("media-record-symbolic", Gtk.IconSize.BUTTON);
        this.pauseImage = Gtk.Image.new_from_icon_name("media-playback-pause-symbolic", Gtk.IconSize.BUTTON);              
        this.parent();
        this.set_image(this.recordImage);
    }
});
