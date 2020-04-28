DEPLOY

    git push heroku `git subtree split --prefix server master`:master --force

DEVELOPMENT

Server

    g ls-files | DEBUG=auth,spotify,axios,sync  entr -cr yarn watch

Client 

    yarn watch
