﻿angular.module('mundialitoApp', ['security', 'ngSanitize', 'ngRoute', 'ngAnimate', 'ui.bootstrap', 'autoFields', 'cgBusy', 'ajoslin.promise-tracker', 'angular-bootstrap-select', 'angular-bootstrap-select.extra', 'ui.bootstrap.datetimepicker', 'FacebookPluginDirectives'])
    .value('cgBusyTemplateName','App/Partials/angular-busy.html')
    .config(['$routeProvider', '$httpProvider', '$locationProvider', '$parseProvider', 'securityProvider', function ($routeProvider, $httpProvider, $locationProvider, $parseProvider, securityProvider) {
        $locationProvider.html5Mode(true);
        $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
        $httpProvider.interceptors.push('myHttpInterceptor');
        securityProvider.urls.login = '/login';

        $routeProvider.
            when('/', {
                templateUrl: 'App/Dashboard/Dashboard.html',
                controller: 'DashboardCtrl',
                resolve: {
                    games: ['GamesManager', function (GamesManager) {
                        return GamesManager.loadAllGames();
                    }]
                }
            }).
            when('/teams', {
                templateUrl: 'App/Teams/Teams.html',
                controller: 'TeamsCtrl',
                resolve: {
                    teams: ['TeamsManager', function (TeamsManager) {
                        return TeamsManager.loadAllTeams();
                    }]
                }
            }).
            when('/teams/:teamId', {
                templateUrl: 'App/Teams/Team.html',
                controller: 'TeamCtrl',
                resolve: {
                    team: ['$route','TeamsManager',  function ($route, TeamsManager) {
                        var teamId = $route.current.params.teamId;
                        return TeamsManager.getTeam(teamId);
                    }],
                    games : ['$route','GamesManager', function ($route, GamesManager) {
                        var teamId = $route.current.params.teamId;
                        return GamesManager.getTeamGames(teamId);
                    }]
                }
            }).
            when('/games/:gameId', {
                templateUrl: 'App/Games/Game.html',
                controller: 'GameCtrl',
                resolve: {
                    game: ['$route','GamesManager', function ($route, GamesManager) {
                        var gameId = $route.current.params.gameId;
                        return  GamesManager.getGame(gameId);
                    }],
                    userBet: ['$q','$route','BetsService', function ($q, $route, BetsService) {
                        var deferred = $q.defer();
                        var gameId = $route.current.params.gameId;
                        BetsService.getUserBetOnGame(gameId).success(function (data) {
                            deferred.resolve(data);
                        });
                        return deferred.promise;
                    }]
                }
            }).
            when('/games', {
                templateUrl: 'App/Games/Games.html',
                controller: 'GamesCtrl',
                resolve: {
                    games: ['GamesManager', function (GamesManager) {
                        return GamesManager.loadAllGames();
                    }],
                    teams : ['TeamsManager', function (TeamsManager) {
                        return TeamsManager.loadAllTeams();
                    }],
                    stadiums : ['StadiumsManager', function (StadiumsManager) {
                        return StadiumsManager.loadAllStadiums();
                    }]
                }
            }).
            when('/stadiums/:stadiumId', {
                templateUrl: 'App/Stadiums/Stadium.html',
                controller: 'StadiumCtrl',
                resolve: {
                    stadium: ['$q','$route','StadiumsManager','GamesManager',  function ($q, $route, StadiumsManager, GamesManager) {
                        var lastDeferred = $q.defer();
                        var stadiumId = $route.current.params.stadiumId;
                        StadiumsManager.getStadium(stadiumId,true).then(function(stadium){
                            var promises = [];
                            for (var i=0; i < stadium.Games.length ; i++) {
                                promises.push(GamesManager.getGame(stadium.Games[i].GameId));
                            }
                            $q.all(promises).then(function(data)
                            {
                                for (var j=0; j < data.length; j++) {
                                    stadium.Games[j] = data[j];
                                }
                                lastDeferred.resolve(stadium)
                            });
                        });
                        return lastDeferred.promise;
                    }]
                }
            }).
            when('/stadiums', {
                templateUrl: 'App/Stadiums/Stadiums.html',
                controller: 'StadiumsCtrl',
                resolve: {
                    stadiums : ['StadiumsManager', function (StadiumsManager) {
                        return StadiumsManager.loadAllStadiums();
                    }]
                }
            }).
            when('/login', {
                templateUrl: 'App/Accounts/Login.html'
            }).
            when('/join', {
                templateUrl: 'App/Accounts/Register.html'
            }).
            when('/manage', {
                templateUrl: 'App/Accounts/Manage.html'
            }).
            otherwise({
                redirectTo: '/'
            });
    }])
    .run(['$rootScope', '$log', 'security', '$route', '$location', function ($rootScope, $log, security, $route, $location) {
        $rootScope.location = $location;
        $rootScope.mundialitoApp = {
            params: null,
            loading: true,
            authenticating: true,
            message: null
        };
        $rootScope.security = security;

        security.events.login = function (security, user) {
            $log.log('Current user details: ' + angular.toJson(user));
            $rootScope.mundialitoApp.authenticating = false;
        };

        security.events.reloadUser = function (security, user) {
            $log.log('User reloaded' + angular.toJson(user));
            $rootScope.mundialitoApp.authenticating = false;
        };

        security.events.logout = function (security) {
            $log.log('User logged out');
            security.authenticate();
        };

        $rootScope.$on('$locationChangeStart', function () {
            $log.debug('$locationChangeStart');
            $rootScope.mundialitoApp.loading = true;
        });
        $rootScope.$on('$locationChangeSuccess', function () {
            $log.debug('$locationChangeSuccess');
            $rootScope.mundialitoApp.params = angular.copy($route.current.params);
            $rootScope.mundialitoApp.loading = false;
        });

        $rootScope.$on('$routeChangeStart', function () {
            $log.debug('$routeChangeStart');
            $rootScope.mundialitoApp.message = 'Loading...';
        });
        $rootScope.$on('$routeChangeSuccess', function () {
            $log.debug('$routeChangeSuccess');
            $rootScope.mundialitoApp.message = null;
        });

    }]);