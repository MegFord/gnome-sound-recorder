AC_INIT([gnome-sound-recorder], [0.1])

AC_CONFIG_MACRO_DIR([m4])
AC_CONFIG_HEADERS([config.h])

AM_INIT_AUTOMAKE([1.11 foreign -Wno-portability tar-ustar dist-xz])
AM_SILENT_RULES([yes])

AC_SUBST([PACKAGE], [$PACKAGE_NAME])

LT_INIT([disable-static])
IT_PROG_INTLTOOL([0.26])

LIBGD_INIT([header-bar notification revealer stack tagged-entry gir])

GLIB_GSETTINGS
GOBJECT_INTROSPECTION_REQUIRE([1.0])

AC_PROG_SED

AC_OUTPUT([
Makefile
data/Makefile
data/gnome-sound-recorder.desktop.in
libgd/Makefile
src/Makefile
po/Makefile.in
])
