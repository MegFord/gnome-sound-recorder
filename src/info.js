Info/*
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

const _TITLE_ENTRY_TIMEOUT = 200;

const InfoDialog = new Lang.Class({
    Name: 'InfoDialog',

    _init: function(fileNav, pass actual filename from array!!!) {
        let fileName = fileNav;
        let uri = GLib.filename_to_uri(this._fileName, null); 

        let dateModified = fileName.dateModified;

        let dateCreatedString = null;
        if (this.fileName.dateCreated != -1) {
            dateCreatedString = fileName.dateCreated;
        }
        
        let appName = null;
        if (this.fileName.appName != -1) {
            appName = fileName.appName;
        }

        let toplevel = Application.application.get_windows()[0];
        this.widget = new Gtk.Dialog ({ resizable: false,
                                        transient_for: toplevel,
                                        modal: true,
                                        destroy_with_parent: true,
                                        default_width: 400,
                                        title: _("Info"),
                                        hexpand: true });
        this.widget.add_button(_("Done"), Gtk.ResponseType.OK);
        this.widget.set_default_response(Gtk.ResponseType.OK);

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
        // in the properties dialog
        this._name = new Gtk.Label({ label: C_("File Name", "Name"),
                                      halign: Gtk.Align.END });
        this._name.get_style_context ().add_class('dim-label');
        grid.add(this._name);

        //  item
        if () {
            // Translators: "Author" is the label next to the document author
            // in the properties dialog
            this._author = new Gtk.Label({ label: C_("Document Author", "Author"),
                                           halign: Gtk.Align.END });
            this._author.get_style_context ().add_class('dim-label');
            grid.add(this._author);
        }

        // Source item
        if (this.fileName.appName) {
        this._source = new Gtk.Label({ label: _("Source"),
                                       halign: Gtk.Align.END });
        this._source.get_style_context ().add_class('dim-label');
        grid.add (this._source);

        // Date Modified item
        this._dateModified = new Gtk.Label({ label: _("Date Modified"),
                                             halign: Gtk.Align.END });
        this._dateModified.get_style_context ().add_class('dim-label');
        grid.add (this._dateModified);

        // Date Created item
        if (dateCreatedString) {
            this._dateCreated = new Gtk.Label({ label: _("Date Created"),
                                                halign: Gtk.Align.END });
            this._dateCreated.get_style_context ().add_class('dim-label');
            grid.add (this._dateCreated);
        }

        // Media type item
        // Translators: "Type" is the label next to the media type
        // (Ogg Vorbis, AAC, ...) in the properties dialog
        this._mediaType = new Gtk.Label({ label: C_("Media Type", "Type"),
                                        halign: Gtk.Align.END });
        this._mediaType.get_style_context ().add_class('dim-label');
        grid.add (this._mediaType);

        // file name value
            this._fileNameEntry = new Gtk.Entry({ activates_default: true,
                                               text: this.fileName.fileName,
                                               editable: true,
                                               hexpand: true,
                                               width_chars: 40,
                                               halign: Gtk.Align.START });
            grid.attach_next_to (this._fileNameEntry, this._name, Gtk.PositionType.RIGHT, 2, 1);

            let docId = doc.id;
            this._fileNameEntryTimeout = 0;

            this._fileNameEntry.connect('changed', Lang.bind (this,
                function() {
                    if (this._fileNameEntryTimeout != 0) {
                        Mainloop.source_remove(this._titleEntryTimeout);
                        this._fileNameEntryTimeout = 0;
                    }

                    this._fileNameEntryTimeout = Mainloop.timeout_add(_TITLE_ENTRY_TIMEOUT, Lang.bind(this,
                        function() {
                            this._fileNameEntryTimeout = 0;
                            let newTitle = this._fileNameEntry.get_text();
                            FileUtil.rename(fileName, newFileName);
                            return false;
                        }));
                }));
        } else {
            this._fileNameEntry = new Gtk.Label({ label: doc.name,
                                               halign: Gtk.Align.START });
            grid.attach_next_to (this._fileNameEntry, this._fileName, Gtk.PositionType.RIGHT, 2, 1);
        }

        // Author value
        if (this._author) {
            this._authorData = new Gtk.Label({ label: doc.author,
                                               halign: Gtk.Align.START });
            grid.attach_next_to (this._authorData, this._author, Gtk.PositionType.RIGHT, 2, 1);
        }

        // Source value
            let sourceLink = Gio.file_new_for_uri(fileName.uri).get_parent();
            let sourcePath = sourceLink.get_path();

            this._sourceData = new Gtk.LinkButton({ label: sourcePath,
                                                    uri: sourceLink.get_uri(),
                                                    halign: Gtk.Align.START });
        }

        grid.attach_next_to (this._sourceData, this._source, Gtk.PositionType.RIGHT, 2, 1);

        // Date Modified value
        this._dateModifiedData = new Gtk.Label({ label: dateModifiedString,
                                                 halign: Gtk.Align.START });
        grid.attach_next_to (this._dateModifiedData, this._dateModified, Gtk.PositionType.RIGHT, 2, 1);

        // Date Created value
        if (this._dateCreated) {
            this._dateCreatedData = new Gtk.Label({ label: dateCreatedString,
                                                    halign: Gtk.Align.START });
            grid.attach_next_to (this._dateCreatedData, this._dateCreated, Gtk.PositionType.RIGHT, 2, 1);
        }

        // Document type value
        this._mediaTypeData = new Gtk.Label({ label: fileName.mediaType,
                                                 halign: Gtk.Align.START });
        grid.attach_next_to (this._mediaTypeData, this._mediaType, Gtk.PositionType.RIGHT, 2, 1);

        this.widget.show_all();
    }
});
