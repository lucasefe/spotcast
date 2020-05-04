DEPLOY

    git push heroku `git subtree split --prefix server master`:master --force

DEVELOPMENT

Server

    g ls-files | DEBUG=auth,spotify,axios,sync  entr -cr yarn watch

    #  or

    fd -e ts | DEBUG=auth,spotify,axios,sync  entr -cr yarn watch

Client

    yarn watch




ROADMAP

* redesign UI/UX.
* detect stop/play on listener as disconnect.
* chat
* history
* export history as playlist
* prevent when leaving fogon,
    https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onbeforeunload