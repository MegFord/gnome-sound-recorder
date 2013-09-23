

appsdir = $(datadir)/applications
apps_DATA = org.gnome.SoundRecorder.desktop

@INTLTOOL_DESKTOP_RULE@

gsettings_SCHEMAS = org.gnome.gnome-sound-recorder.gschema.xml

@INTLTOOL_XML_NOMERGE_RULE@ 
@GSETTINGS_RULES@

org.gnome.gnome-sound-recorder.service: org.gnome.gnome-sound-recorder.service.in
	$(AM_V_GEN) sed \
		-e "s|[@]PACKAGE_NAME@|$(PACKAGE_NAME)|g" \
		-e "s|[@]pkgdatadir@|$(pkgdatadir)|g" \
		-e "s|[@]pkglibdir@|$(pkglibdir)|g" \
		$< > $@

org.gnome.SoundRecorder.desktop.in: org.gnome.SoundRecorder.desktop.in.in
	$(AM_V_GEN) sed \
		-e "s|[@]PACKAGE_NAME@|$(PACKAGE_NAME)|g" \
		-e "s|[@]pkgdatadir@|$(pkgdatadir)|g" \
		-e "s|[@]pkglibdir@|$(pkglibdir)|g" \
		$< > $@

servicedir = $(datadir)/dbus-1/services
service_DATA = org.gnome.gnome-sound-recorder.service

EXTRA_DIST = \
	org.gnome.SoundRecorder.desktop.in.in \
	org.gnome.gnome-sound-recorder.service.in \
	$(gsettings_SCHEMAS) \
	$(resource_files) \
	$(NULL)

CLEANFILES = \
	org.gnome.SoundRecorder.desktop.in \
	org.gnome.gnome-sound-recorder.service \
	$(apps_DATA) \
	*.valid \
	gschemas.compiled \
	$(NULL)

# For uninstalled use
all-local:
	$(GLIB_COMPILE_SCHEMAS) $(builddir)


