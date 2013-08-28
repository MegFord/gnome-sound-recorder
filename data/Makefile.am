# I chose to use recursive automake so I can use nobase_ and avoid
# 5 different directory declarations

appsdir = $(datadir)/applications
apps_DATA = $(PACKAGE_NAME).desktop

@INTLTOOL_DESKTOP_RULE@

gsettings_SCHEMAS = $(PACKAGE_NAME).gschema.xml

@INTLTOOL_XML_NOMERGE_RULE@ 
@GSETTINGS_RULES@

$(PACKAGE_NAME).service: $(PACKAGE_NAME).service.in
	$(AM_V_GEN) sed \
		-e "s|[@]PACKAGE_NAME@|$(PACKAGE_NAME)|g" \
		-e "s|[@]pkgdatadir@|$(pkgdatadir)|g" \
		-e "s|[@]pkglibdir@|$(pkglibdir)|g" \
		$< > $@

$(PACKAGE_NAME).desktop.in: $(PACKAGE_NAME).desktop.in.in
	$(AM_V_GEN) sed \
		-e "s|[@]PACKAGE_NAME@|$(PACKAGE_NAME)|g" \
		-e "s|[@]pkgdatadir@|$(pkgdatadir)|g" \
		-e "s|[@]pkglibdir@|$(pkglibdir)|g" \
		$< > $@

servicedir = $(datadir)/dbus-1/services
service_DATA = $(PACKAGE_NAME).service

EXTRA_DIST = \
	CREDITS \
	$(PACKAGE_NAME).desktop.in.in \
	$(PACKAGE_NAME).service.in \
	$(gsettings_SCHEMAS) \
	$(resource_files) \
	$(NULL)

CLEANFILES = \
	$(PACKAGE_NAME).desktop.in \
	$(PACKAGE_NAME).service \
	$(apps_DATA) \
	*.valid \
	gschemas.compiled \
	$(NULL)

# For uninstalled use
all-local:
	$(GLIB_COMPILE_SCHEMAS) $(builddir)

-include $(top_srcdir)/git.mk


