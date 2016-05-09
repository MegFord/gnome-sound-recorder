  /*
   * Modified version of notifications.js from GNOME Documents
   * Copyright 2016 Meg Ford
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
   * License along with this library; if not, see <http://www.gnu.org/licenses/>.
   *
   *
   * Author: Meg Ford <megford@gnome.org>
   *
   */

const Gd = imports.gi.Gd;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Mainloop = imports.mainloop;

const _ = imports.gettext.gettext;
const C_ = imports.gettext.pgettext;

const MainWindow = imports.mainWindow;

const DELETE_TIMEOUT = 10;

const UndoDeleteNotification = new Lang.Class({
  Name: 'UndoDeleteNotification',
  Extends: Gd.Notification,

      _init: function(fileNav) {

        // NEED TO USE libgd notifications for this.
        this.parent({ timeout: -1,
                      show_close_button: true,
                      halign: Gtk.Align.CENTER,
                      valign: Gtk.Align.START });

        this._grid = new Gtk.Grid({ orientation: Gtk.Orientation.VERTICAL,
                                    row_spacing: 6 });

        this.add(this._grid);

        let grid = new Gtk.Grid ({ orientation: Gtk.Orientation.HORIZONTAL,
                                   column_spacing: 12 });

        let contentArea = this.widget.get_content_area();
        contentArea.pack_start(grid, true, true, 2);

        let message = (_("“%s” deleted")).format(fileNav.fileName);
        this._name = new Gtk.Label({ label: message,
                                     halign: Gtk.Align.START });
        grid.add(this._name);

        let cancelButton = new Gtk.Button({ label: _("Undo") });
        // cancelButton.connect("clicked", Lang.bind(this, this.onCancelClicked));

        grid.attach_next_to(cancelButton, this._name, Gtk.PositionType.RIGHT, 2, 1);

        let closeImage = Gtk.Image.new({ name: "closeImage" });
        closeImage.set_from_icon_name('window-close-symbolic', Gtk.IconSize.BUTTON);
        let doneButton = new Gtk.Button();
        doneButton.set_image(closeImage);
        // doneButton.connect("clicked", Lang.bind(this, this.onDoneClicked));

        grid.attach_next_to(doneButton, cancelButton, Gtk.PositionType.RIGHT, 3, 1);
        this._grid.add(grid)
        this.show_all();

        this._timeoutId = Mainloop.timeout_add_seconds(DELETE_TIMEOUT, Lang.bind(this,
            function() {
                this._timeoutId = 0;
                this.onDoneClicked();
                return false;
            }));
    },

    onDoneClicked: function() {
        this.onDestroy();
        this.widget.destroy();
    },

    onCancelClicked: function() {
        this.widget.destroy();
    },

    onDestroy: function(){
        if (this._timeoutId != 0) {
            Mainloop.source_remove(this._timeoutId);
            this._timeoutId = 0;
        }
    }
});