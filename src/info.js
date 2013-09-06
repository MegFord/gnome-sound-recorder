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
 *
 */

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;
const _ = imports.gettext.gettext;
const C_ = imports.gettext.pgettext;
const Lang = imports.lang;

const MainWindow = imports.mainWindow;
const FileUtil = imports.fileUtil;

const _FILE_NAME_ENTRY_TIMEOUT = 600;

const InfoDialog = new Lang.Class({
    Name: 'InfoDialog',

    _init: function(fileNav) {
        let fileName = fileNav;
        
        this.nav = MainWindow.fileUtil.loadFile(fileName.fileName);
        
        //let toplevel = Application.get_windows()[0];
        this.widget = new Gtk.Dialog ({ resizable: false,
                                        //transient_for: toplevel,
                                        modal: true,
                                        destroy_with_parent: true,
                                        default_width: 400,
                                        title: _("Info"),
                                        hexpand: true });
        
        let header = new Gtk.HeaderBar({ hexpand: true });
        header.set_show_close_button(false);
        this.widget.set_titlebar(header);
        
        let cancelToolbar = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL,
                                          spacing: 0 });
        cancelToolbar.get_style_context().add_class(Gtk.STYLE_CLASS_LINKED);
        header.pack_start(cancelToolbar);
        
        let cancelButton = new Gtk.Button({ label: _("Cancel"),
                                            margin_bottom: 4,
                                            margin_top: 6,
                                            margin_right: 6 });
        cancelButton.connect("clicked", Lang.bind(this, this.onCancelClicked));
        cancelToolbar.pack_end(cancelButton, false, true, 0);
        cancelButton.show();
        cancelToolbar.show();
        
        let buttonToolbar = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL,
                                          spacing: 0 });
        buttonToolbar.get_style_context().add_class(Gtk.STYLE_CLASS_LINKED);
        header.pack_end(buttonToolbar);
        
        let button = new Gtk.Button({ label: _("Done"),
                                      margin_bottom: 4,
                                      margin_top: 6,
                                      margin_right: 6 });
        button.connect("clicked", Lang.bind(this, this.onDoneClicked));
        buttonToolbar.pack_end(button, false, true, 0);
        button.show();
        buttonToolbar.show();      

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

        // File Name item
        // Translators: "File Name" is the label next to the file name
        // in the info dialog
        this._name = new Gtk.Label({ label: C_("File Name", "Name"),
                                     halign: Gtk.Align.END });
        this._name.get_style_context ().add_class('dim-label');
        grid.add(this._name);


        // Source item
        this._source = new Gtk.Label({ label: _("Source"),
                                       halign: Gtk.Align.END });
        this._source.get_style_context ().add_class('dim-label');
            
        if (fileName.appName != null) {
            grid.add(this._source);
        }

        // Date Modified item
        this._dateModifiedLabel = new Gtk.Label({ label: _("Date Modified"),
                                                  halign: Gtk.Align.END });
        this._dateModifiedLabel.get_style_context ().add_class('dim-label');
        grid.add(this._dateModifiedLabel);

        // Date Created item
        this._dateCreatedLabel = new Gtk.Label({ label: _("Date Created"),
                                                 halign: Gtk.Align.END });
        this._dateCreatedLabel.get_style_context ().add_class('dim-label');
        
        if (fileName.dateCreated != null) {
            grid.add(this._dateCreatedLabel);
        }

        // Media type item
        // Translators: "Type" is the label next to the media type
        // (Ogg Vorbis, AAC, ...) in the info dialog
        this._mediaType = new Gtk.Label({ label: C_("Media Type", "Type"),
                                          halign: Gtk.Align.END });
        this._mediaType.get_style_context ().add_class('dim-label');
        grid.add(this._mediaType);

        // File name value
        this._fileNameEntry = new Gtk.Entry({ activates_default: true,
                                              text: fileName.fileName,
                                              editable: true,
                                              hexpand: true,
                                              width_chars: 40,
                                              halign: Gtk.Align.START });
        grid.attach_next_to(this._fileNameEntry, this._name, Gtk.PositionType.RIGHT, 2, 1);

        // Source value
        let uri = GLib.filename_to_uri(this.nav, null);
        let sourceLink = Gio.file_new_for_uri(uri).get_parent();
        let sourcePath = sourceLink.get_path();
        log(sourceLink.get_uri());
        log(sourcePath);

        this._sourceData = new Gtk.LinkButton({ label: sourcePath,
                                                uri: sourceLink.get_uri(),
                                                halign: Gtk.Align.START });
        if (fileName.appName != null)
            grid.attach_next_to(this._sourceData, this._source, Gtk.PositionType.RIGHT, 2, 1);

        // Date Modified value
        if (fileName.dateModified != null) {
            this._dateModifiedData = new Gtk.Label({ label: fileName.dateModified,
                                                     halign: Gtk.Align.START });
            grid.attach_next_to(this._dateModifiedData, this._dateModifiedLabel, Gtk.PositionType.RIGHT, 2, 1);
        }

        // Date Created value
        if (fileName.dateCreated) {
            this._dateCreatedData = new Gtk.Label({ label: fileName.dateCreated,
                                                    halign: Gtk.Align.START });
            grid.attach_next_to(this._dateCreatedData, this._dateCreatedLabel, Gtk.PositionType.RIGHT, 2, 1);
        }

        // Document type value
        this._mediaTypeData = new Gtk.Label({ label: fileName.mediaType,
                                              halign: Gtk.Align.START });
        grid.attach_next_to(this._mediaTypeData, this._mediaType, Gtk.PositionType.RIGHT, 2, 1);

        this.widget.show_all();
    },
    
    onDoneClicked: function() {
        let newFileName = this._fileNameEntry.get_text(); 
        MainWindow.fileUtil.rename(this.nav, newFileName);
        this.widget.destroy(); 
    },
    
    onCancelClicked: function() {
        this.widget.destroy();    
    }  
});
