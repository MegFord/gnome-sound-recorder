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
* License along with this library; if not, see <http://www.gnu.org/licenses/>.
*
* Author: Meg Ford <megford@gnome.org>
*
*/

const Util = imports.util;
const Gio = imports.gi.Gio;
const Gst = imports.gi.Gst;
const GLib = imports.gi.GLib;

const MainWindow = imports.mainWindow;
const Preferences = imports.preferences;

let application = null;

const Application = new Lang.Class({
    Name: 'Application',
    Extends: Gtk.Application,

    _init: function() {
        this.parent({ application_id: "org.gnome.SoundRecorder"}); 
        GLib.set_application_name(_("SoundRecorder"));         
    },
    
    _initAppMenu: function() {
        let menu = new Gio.Menu();
        let section = new Gio.Menu();
        menu.append_section(null, section);
        section.append(_("Preferences"), 'app.preferences');
        section = new Gio.Menu();
        menu.append_section(null, section);
        section.append(_("About"), 'app.about');
        section.append(_("Quit"),'app.quit');
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
        application = this;

        /* Translators: "Recordings" here refers to the name of the directory where the application places files */
        let path = GLib.build_filenamev([GLib.get_home_dir(), _("Recordings")]);

        // Ensure Recordings directory
        GLib.mkdir_with_parents(path, 0755);
        this.saveDir = Gio.file_new_for_path(path);
    },

    vfunc_activate: function() {
        (this.window = new MainWindow.MainWindow({ application: this })).show();
    },
    
    onWindowDestroy: function() {
        if (MainWindow.wave != null)
            MainWindow.wave.pipeline.set_state(Gst.State.NULL);          
    },
    
    _showPreferences: function() {
         let preferencesDialog = new Preferences.Preferences();

        preferencesDialog.widget.connect('response', Lang.bind(this,
            function(widget, response) {
                preferencesDialog.widget.destroy();
            }));
    },
    
    _showAbout: function() {
        let aboutDialog = new Gtk.AboutDialog({ use_header_bar: true });
        aboutDialog.artists = [ 'Reda Lazri <the.red.shortcut@gmail.com>',
                                'Garrett LeSage <garrettl@gmail.com>',
                                'Hylke Bons <hylkebons@gmail.com>',
                                'Sam Hewitt <hewittsamuel@gmail.com>' ];
        aboutDialog.authors = [ 'Meg Ford <megford@gnome.org>' ];
        /* Translators: Replace "translator-credits" with your names, one name per line */
        aboutDialog.translator_credits = _("translator-credits");
        aboutDialog.program_name = _("Sound Recorder");
        aboutDialog.copyright = 'Copyright ' + String.fromCharCode(0x00A9) + ' 2013' + String.fromCharCode(0x2013) + 'Meg Ford';
        aboutDialog.license_type = Gtk.License.GPL_2_0;
        aboutDialog.logo_icon_name = 'audio-input-microphone';
        aboutDialog.version = '3.11.4';
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

