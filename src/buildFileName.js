/*
 *  Author: Meg Ford <megford@gnome.org>
 *
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
 */
 
imports.gi.versions.Gst = '0.1';

const Gst = imports.gi.Gst;
const GLib = imports.gi.GLib;

const Record = imports.record;

const buildFileName = new Lang.Class({
    Name: 'BuildFileName',

      buildDefaultFilename: function() {
        let path = ["/"]; 
        let homeDirName = GLib.get_home_dir();
        let tilde = path[0];
        let defaultDir = "Recordings";
        //GLib.mkdir_with_parents(homeDirName + tilde + defaultDir, 775);
        let DateTimeString = GLib.DateTime.new_now_local();
        let origin = DateTimeString.format("%Y-%m-%d %H:%M:%S");
        let extension = ".ogg";
        let editedOrigin = origin + extension;        
        let defaultFileName = [homeDirName, tilde, defaultDir, tilde, editedOrigin];
        // Use GLib.build_filenamev to work around missing vararg functions.
        let name = GLib.build_filenamev(defaultFileName);
        log(name);
        return name;                       
    }
});
