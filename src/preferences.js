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

const Preferences = new Lang.Class({
    Name: 'Preferences',
    
     _init: function() {     
        this.widget = new Gtk.Dialog ({ resizable: false,
                                        //transient_for: toplevel,
                                        modal: true,
                                        destroy_with_parent: true,
                                        default_width: 400,
                                        title: _("Preferences"),
                                        hexpand: true });
       

        let grid = new Gtk.Grid ({ orientation: Gtk.Orientation.VERTICAL,
                                   row_homogeneous: true,
                                   column_homogeneous: true,
                                   halign: Gtk.Align.CENTER,
                                   row_spacing: 6,
                                   column_spacing: 24,
                                   margin_top: 12,
                                   margin_left: 24,
                                   margin_right: 24,
                                   margin_bottom: 12 });

        let contentArea = this.widget.get_content_area();
        contentArea.pack_start(grid, true, true, 2);
        
        this.widget.add_button(_("Done"), Gtk.ResponseType.OK);
        
        this._name = new Gtk.Label({ label: C_("File Name", "Name"),
                                      halign: Gtk.Align.END });
        this._name.get_style_context ().add_class('dim-label');
        grid.add(this._name);
        
        this.widget.show_all();
      },
      
      onDoneClicked: function() {
        this.widget.destroy(); 
      }  
      
});
