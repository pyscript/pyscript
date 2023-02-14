# Freedom Units!

This is a demo Toga app implementing a Fahrenheit to Celsius converter.

It can be served as a Single Page App from a static web server.

## Initial setup

1. Create and activate a virtual environment, and move into the `freedom`
   project directory:

    $ python -m venv venv
    $ . ./venv/bin/activate
    $ cd freedom

2. Install Briefcase:

    $ pip install briefcase

## Web app

This app can be viewed as a Single Page App (SPA); this version of the app is
linked from the main PyScript demo pages. To re-build the app and start a
local webserver, run:

    $ briefcase run web

## Desktop app

To run this app as a desktop app in development mode:

    $ briefcase dev

To build and run it as an app bundle:

    $ briefcase run

## Mobile app

To run this in the iOS simulator, run:

    $ briefcase run iOS

To run this in the Android simulator, run:

    $ briefcase run android

Note that these builds have extensive requirements that must be installed -
Xcode for iOS, and the Android SDKs for Android. These are multiple gigabyte
downloads. Briefcase will detect when these tools aren't available, and either
prompt you to download them, or perform a download for you. As a result, your
first build may take up to 20 minutes to complete, depending on the speed of
your connection.
