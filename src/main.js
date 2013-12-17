// -*- Mode: js; indent-tabs-mode: nil; c-basic-offset: 4; tab-width: 4 -*-
//
// Copyright (c) 2013 Giovanni Campagna <scampa.giovanni@gmail.com>
// Copyright (c) 2013 Meg Ford <megford@gnome.org>
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

pkg.initSubmodule('libgd');
pkg.initGettext();
pkg.initFormat();
pkg.require({ 'Gd': '1.0',
              'Gdk': '3.0',
              'GLib': '2.0',
              'GObject': '2.0',
              'Gtk': '3.0',
              'Lang': '',
              'Mainloop': '',
              'Params': '1.0',
              'System': '' });
              
imports.gi.versions.Gst = '1.0';

const Util = imports.util;
const Gio = imports.gi.Gio;
const Gst = imports.gi.Gst;
const GLib = imports.gi.GLib;

const MainWindow = imports.mainWindow;
const Preferences = imports.preferences;

const Application = new Lang.Class({
    Name: 'Application',
    Extends: Gtk.Application,

    _init: function() {
        this.parent({ application_id: "org.gnome.SoundRecorder"}); 
        GLib.set_application_name(_("SoundRecorder"));         
    },
    
    _initAppMenu: function() {
        let menu = new Gio.Menu();
        menu.append("Preferences", 'app.preferences');
        menu.append('About Sound Recorder', 'app.about');
        menu.append("Quit",'app.quit');    
        this.set_app_menu(menu);
        
        let preferences = new Gio.SimpleAction({ name: 'preferences' });
        preferences.connect('activate', Lang.bind(this,
            function() {
                this._showPreferences();
            }));
        this.add_action(preferences);
        
        let aboutAction = new Gio.SimpleAction({ name: 'about' });
        aboutAction.connect('activate', Lang.bind(this, 
            function() {
                this._showAbout();
            }));
        this.add_action(aboutAction);
        
        let quitAction = new Gio.SimpleAction({ name: 'quit' });
        quitAction.connect('activate', Lang.bind(this,
            function() {
                this.quit();
            }));
         this.add_action(quitAction);
    },

    vfunc_startup: function() {
        this.parent();

        Util.loadStyleSheet();
        log(_("Sound Recorder started"));
        Gst.init(null, 0);
        this._initAppMenu();
    },

    vfunc_activate: function() {
        (this.window = new MainWindow.MainWindow({ application: this })).show();
    },
    
    _showPreferences: function() {
         let preferencesDialog = new Preferences.Preferences();

        preferencesDialog.widget.connect('response', Lang.bind(this,
            function(widget, response) {
                preferencesDialog.widget.destroy();
            }));
    },
    
    _showAbout: function() {
        let aboutDialog = new Gtk.AboutDialog();       
        aboutDialog.artists = [ 'Reda Lazri <the.red.shortcut@gmail.com>',
                                'Garrett LaSage <garrettl@gmail.com>',
                                'Hylke Bons <hylkebons@gmail.com>' ];
        aboutDialog.authors = [ 'Meg Ford <megford@gnome.org>' ];
        /* Translators: Replace "translator-credits" with your names, one name per line */
        aboutDialog.translator_credits = _("translator-credits");
        aboutDialog.program_name = _("Sound Recorder");
        aboutDialog.copyright = 'Copyright ' + String.fromCharCode(0x00A9) + ' 2013' + String.fromCharCode(0x2013) + 'Meg Ford';
        aboutDialog.license_type = Gtk.License.GPL_2_0;
        aboutDialog.version = '3.11.3';
        aboutDialog.website = 'http://live.gnome.org/GnomeSoundRecorder';
        aboutDialog.wrap_license = true;
        aboutDialog.modal = true;
        aboutDialog.transient_for = this.window;

        aboutDialog.show();
        aboutDialog.connect('response', function() {
            aboutDialog.destroy();
        });
    }
});

function main(argv) {
    return (new Application()).run(argv);
}
