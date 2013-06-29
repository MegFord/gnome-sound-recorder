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
 * Author: Meg Ford <megford@gnome.org>
 *
 */
 
imports.gi.versions.Gst = '1.0';

const _ = imports.gettext.gettext;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject; 
const Gst = imports.gi.Gst;
const GstPbutils = imports.gi.GstPbutils;
const Signals = imports.signals;

const Application = imports.application;

const FileUtil = new Lang.Class({
    Name: "FileUtil",
        
    rename: function() { 
       /*
       let s = ff.get_child("Recordings");
       let l = Gio.file_new_for_path("/home/meg/Recordings/newName.mp3");
        l.set_display_name("lettuce", null);*/
    },
    
    loadFile: function() {
        let path = Application.path;
        // Write the loadfile when eggslistbox is finished
    }    
});
    
const _OFFSET_STEP = 10;

const OffsetController = new Lang.Class({
    Name: 'OffsetController',

    _init: function(context) {
        this._offset = 0;
        this._itemCount = 0;
        this._context = context;
    },

    // to be called to load more files into the listview
    increaseOffset: function() {
        this._offset += _OFFSET_STEP;
        this.emit('offset-changed', this._offset);
    },

    // to be called when a recording is made/deleted
    resetItemCount: function() {
      Application.list.enumerateDirectory();         
    },

    resetOffset: function() {
        this._offset = 0;
    },

    getItemCount: function() {
        this._itemCount = Application.list.getItemCount();
        log("itemCount");
        log(this._itemCount); 
    },

    getRemainingFiles: function() {
        return (this._itemCount - (this._offset + _OFFSET_STEP));
    },

    getOffsetStep: function() {
        return _OFFSET_STEP;
    },

    getOffset: function() {
        return this._offset;
    }
});
Signals.addSignalMethods(OffsetController.prototype);

