# Configuration file for the Sphinx documentation builder.
#
# This file only contains a selection of the most common options. For a full
# list see the documentation:
# https://www.sphinx-doc.org/en/master/usage/configuration.html

# -- Path setup --------------------------------------------------------------

# If extensions (or modules to document with autodoc) are in another directory,
# add these directories to sys.path here. If the directory is relative to the
# documentation root, use os.path.abspath to make it absolute, like shown here.
#
import os

# import sys
# sys.path.insert(0, os.path.abspath('.'))


# -- Project information -----------------------------------------------------

project = "PyScript"
copyright = "(c) 2022, Anaconda, Inc."
author = "Anaconda, Inc."
language = "en"

# -- General configuration ---------------------------------------------------

# Add any Sphinx extension module names here, as strings. They can be
# extensions coming with Sphinx (named 'sphinx.ext.*') or your custom
# ones.
extensions = [
    "myst_parser",
    "sphinx_copybutton",
    "sphinx_design",
    "sphinx_togglebutton",
    "sphinx_sitemap",
    "sphinxemoji.sphinxemoji",
    "sphinxcontrib.youtube",
]

# Add any paths that contain templates here, relative to this directory.
templates_path = ["_templates"]

# List of patterns, relative to source directory, that match files and
# directories to ignore when looking for source files.
# This pattern also affects html_static_path and html_extra_path.
exclude_patterns = ["_build", "Thumbs.db", ".DS_Store", "_env", "README.md"]


# -- Options for HTML output -------------------------------------------------

# The theme to use for HTML and HTML Help pages.  See the documentation for
# a list of builtin themes.
#
html_theme = "pydata_sphinx_theme"

html_logo = "_static/images/avatar.jpg"

# Add any paths that contain custom static files (such as style sheets) here,
# relative to this directory. They are copied after the builtin static files,
# so a file named "default.css" will overwrite the builtin "default.css".
html_static_path = ["_static"]
# html_css_files = ["styles/custom.css"]

html_baseurl = os.environ.get("SPHINX_HTML_BASE_URL", "http://127.0.0.1:8000/")
sitemap_locales = [None]
sitemap_url_scheme = "{link}"

html_extra_path = ["robots.txt"]

html_theme_options = {
    "github_url": "https://github.com/pyscript/pyscript",
    "twitter_url": "https://twitter.com/pyscript_dev",
    "icon_links_label": "Quick Links",
    # "google_analytics_id": "G-XXXXXXXXXX",
    "use_edit_page_button": True,
    "show_nav_level": 2,
    "external_links": [
        # {"name": "GitHub repo", "url": "https://github.com/pyscript/pyscript"},
    ],
}

html_context = {
    "default_mode": "dark",
    "pygment_light_style": "tango",
    "pygment_dark_style": "native",
    "github_user": "pyscript",
    "github_repo": "pyscript",
    "github_version": "main",
    "doc_path": "docs",
}


myst_enable_extensions = [
    "dollarmath",
    "amsmath",
    "deflist",
    "html_admonition",
    "html_image",
    "colon_fence",
    "smartquotes",
    "replacements",
]
