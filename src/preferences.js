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
* Author: Meg Ford <megford@gnome.org>
*
*/

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;
const _ = imports.gettext.gettext;
const C_ = imports.gettext.pgettext;

const MainWindow = imports.mainWindow;
const Main = imports.main;

let comboBoxText = null;
let recordVolume= null;
let playVolume = null;

const Preferences = new Lang.Class({
    Name: 'Preferences',
    
     _init: function() {  
        //let toplevel = Main.Application.get_windows()[0];   
        this.widget = new Gtk.Dialog ({ resizable: false,
                                        //transient_for: toplevel,
                                        modal: true,
                                        destroy_with_parent: true,
                                        width_request: 350,
                                        margin_top: 5,
                                        hexpand: true }); 
                                        
        this.widget.add_button(_("Done"), Gtk.ResponseType.OK);                                     
        
        let mainGrid = new Gtk.Grid({ orientation: Gtk.Orientation.VERTICAL,
                                      row_spacing: 6,
                                      margin_left: 12,
                                      margin_right: 12,
                                      margin_bottom: 12,
                                      margin_top: 12  });
        let contentArea = this.widget.get_content_area();
        contentArea.pack_start(mainGrid, true, true, 0);
       
        let grid = new Gtk.Grid({ orientation: Gtk.Orientation.VERTICAL,
                                    hexpand: true,
                                    vexpand: true,
                                    column_spacing: 18,
                                    row_spacing: 6,
                                    margin_bottom: 12,
                                    margin_top: 12 });
        mainGrid.add(grid);

        
        let formatLabel = new Gtk.Label({ label: '<b>' + _("Preferred format") + '</b>',
                                          halign: Gtk.Align.START,
                                          use_markup: true });
        grid.attach(formatLabel, 0, 0, 1, 1);
        
        comboBoxText = new MainWindow.EncoderComboBox({ halign: Gtk.Align.END });
        grid.attach(comboBoxText, 2, 0, 1, 1);
        
        let volumeLabel = new Gtk.Label({ label: '<b>' + _("Volume") + '</b>',
                                          halign: Gtk.Align.START,
                                          use_markup: true });
        grid.attach(volumeLabel, 0, 1, 2, 1);
        
        playVolume = new Gtk.Scale({ orientation: Gtk.Orientation.HORIZONTAL });
        this.playRange = Gtk.Adjustment.new(MainWindow.volumeValue[0].play, 0, 1.0, 0.05, 0.0, 0.0);
        playVolume.set_adjustment(this.playRange);
        playVolume.set_sensitive(true);
        playVolume.connect("value-changed", Lang.bind(this, 
            function() {
                MainWindow.view.presetVolume(MainWindow.ActiveArea.PLAY, playVolume.get_value());
            }));
        grid.attach(playVolume, 2, 1, 2, 1);
        
        let micVolLabel = new Gtk.Label({ label: '<b>' + _("Microphone") + '</b>',
                                          halign: Gtk.Align.START,
                                          use_markup: true });
        grid.attach(micVolLabel, 0, 2, 2, 1);
        
        recordVolume = new Gtk.Scale({ orientation: Gtk.Orientation.HORIZONTAL });
        this.recordRange = Gtk.Adjustment.new(MainWindow.volumeValue[0].record, 0, 1.0, 0.05, 0.0, 0.0);
        recordVolume.set_adjustment(this.recordRange);
        recordVolume.set_sensitive(true);
        recordVolume.connect("value-changed", Lang.bind(this, 
            function() {
                MainWindow.view.presetVolume(MainWindow.ActiveArea.RECORD, recordVolume.get_value());
            }));
        grid.attach(recordVolume, 2, 2, 2, 1);
        
        this.widget.show_all();
      },
      
      onDoneClicked: function() {
        this.widget.destroy(); 
      }      
});
