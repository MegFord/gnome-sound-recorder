SUBDIRS = appdata icons

resourcedir = $(pkgdatadir)
resource_DATA = application.css

appsdir = $(datadir)/applications
apps_DATA = org.gnome.SoundRecorder.desktop

@INTLTOOL_DESKTOP_RULE@

gsettings_SCHEMAS = org.gnome.gnome-sound-recorder.gschema.xml

@INTLTOOL_XML_NOMERGE_RULE@ 
@GSETTINGS_RULES@


org.gnome.SoundRecorder.desktop.in: org.gnome.SoundRecorder.desktop.in.in
	$(AM_V_GEN) sed \
		-e "s|[@]PACKAGE_NAME@|$(PACKAGE_NAME)|g" \
		-e "s|[@]pkgdatadir@|$(pkgdatadir)|g" \
		-e "s|[@]pkglibdir@|$(pkglibdir)|g" \
		$< > $@


EXTRA_DIST = \
	org.gnome.SoundRecorder.desktop.in.in \
	$(gsettings_SCHEMAS) \
	application.css \
	$(NULL)

CLEANFILES = \
	org.gnome.SoundRecorder.desktop.in \
	$(apps_DATA) \
	*.valid \
	gschemas.compiled \
	$(NULL)

# For uninstalled use
all-local:
	$(GLIB_COMPILE_SCHEMAS) $(builddir)


