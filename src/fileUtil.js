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
const Listview = imports.listview;

const FileUtil = new Lang.Class({
    Name: "FileUtil",
        
   rename: function(fileName, newFileName) { 
       let l = Gio.file_new_for_path(fileName);
        l.set_display_name_async(newFileName, GLib.PRIORITY_DEFAULT, null, null);
    },
    
    loadFile: function(text) { 
        this._text = text;
        let path = Application.path;
        path.push(this._text);
        let fileNav = GLib.build_filenamev(path);
       
        return fileNav;
    },
    
    deleteFile: function(fileNav) {
        this._fileNav = fileNav;
        this._fileToDelete = Gio.file_new_for_path(this._fileNav);       
        this._fileToDelete.delete_async(GLib.PRIORITY_DEFAULT, null, Lang.bind(this, this._deleteFileCallback));
    }, 
    
    _deleteFileCallback: function(obj, res) {
        this._deleted = obj.delete_finish(res);
        //this._list = new Listview.Listview();
        //this._list.enumerateDirectory();
       // Application.offsetController.resetOffset();
       //Application.add_named(groupGrid, name);
        
    }      
});
    
const _OFFSET_STEP = 10;
let CurrentEndIdx;

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
    },
    
    setEndIdx: function() {
        this.totItems = Application.list.getItemCount();
        log(this.totItems);
        this.ensureCount = this._offset + _OFFSET_STEP - 1; 
        log(this.ensureCount);
        log("counitn");
        this.getItemCount();
        if (this.ensureCount < this.totItems) {
            this.endIdx = this.ensureCount;
            log(this.endIdx);
            log("wtf");}
        else {
            this.endIdx = this.totItems - 1;
            log(this.endIdx); 
            log("ttt");}
            
        CurrentEndIdx = this.endIdx;
        this.getcidx();
    },
    
    getcidx: function() {
        return CurrentEndIdx;
    }
});
Signals.addSignalMethods(OffsetController.prototype); 


