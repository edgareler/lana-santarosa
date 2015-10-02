/* 
 Created on : 14/12/2014, 03:58:48
 Author     : Edgar Eler <eler@edgar.systems>
 */

var btStart, splashScreen, dvObjetivos, btnObjetivos, map, jsobj, missao, etapa,
    now, nowTime, gameDate, gameTime, localObj, localPoint, locaisFilhos,
    centerMapPoint, destinoAtual, zoomDestinoAtual, lastCenterCall, distancia,
    nomeMissao, ulObjetivos, prazo, cidade, localCidade, localEtapa,
    marcadorDestinoAtual, pergunta, localPergunta, titlePergunta,
    alternativasPergunta, dicaPergunta, directionsDisplay, directionsService,
    tmpOrigem, tmpDestino, streetView, globe, tmpLocal, aero, dicas, btnDicas,
    listaDicas, maxZoomAtual = 18, btDvInfos, infos, descInfo;

var tmpDuracao = 0;

var etapasConcluidas = Array();
var marcadores = Array();
var aeroportos = [10, 12, 16, 20];
//var marcadoresClicados = Array();

var rad = function(x) {
    return x * Math.PI / 180;
};

var getDistance = function(p1, p2) {
    var R = 6378137; // Earth’s mean radius in meter
    var dLat = rad(p2.lat() - p1.lat());
    var dLong = rad(p2.lng() - p1.lng());
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(rad(p1.lat())) * Math.cos(rad(p2.lat())) *
        Math.sin(dLong / 2) * Math.sin(dLong / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return d; // returns the distance in meter
};

Date.prototype.addMinutes = function(m) {
    this.setMinutes(this.getMinutes() + m);
    return this;
};

Date.prototype.addHours = function(h) {
    this.setHours(this.getHours() + h);
    return this;
};

window.onbeforeunload = function(e) {
    return "Todo o progresso de seu jogo será perdido. Deseja realmente sair?";
};

window.onload = function() {
//    btStart = document.querySelector("#bt-start");
    initialize();

    btStart = document.getElementById("btStart");
    splashScreen = document.getElementById("splash");
    dvObjetivos = document.getElementById("objetivos");
    btnObjetivos = document.getElementById("btnObjetivos");
    nomeMissao = document.getElementById("nomeMissao");
    ulObjetivos = document.getElementById("ulObjetivos");
    prazo = document.getElementById("prazo");
    cidade = document.getElementById("cidade");
    pergunta = document.getElementById("pergunta");
    localPergunta = document.getElementById("localPergunta");
    titlePergunta = document.getElementById("titlePergunta");
    alternativasPergunta = document.getElementById("alternativasPergunta");
    dicaPergunta = document.getElementById("dicaPergunta");
    globe = document.getElementById("globe");
    aero = document.getElementById("aero");
    dicas = document.getElementById("dicas");
    btnDicas = document.getElementById("btnDicas");
    listaDicas = document.getElementById("listaDicas");
    btDvInfos = document.getElementById("btDvInfos");
    infos = document.getElementById("infos");
    descInfo = document.getElementById("descInfo");

    dvObjetivos.onclick = pergunta.onclick = dicas.onclick = infos.onclick = function() {
        this.style.display = "none";
    };

    pergunta.onclick = function() {
        tmpDuracao = 0;
        tmpOrigem = null;
        tmpDestino = null;

        this.style.display = "none";
    };

    btnObjetivos.onclick = function() {
        dvObjetivos.style.display = "block";
    };

    btnDicas.onclick = btDvInfos.onclick = function() {
        dicas.style.display = "block";
    };

    btDvInfos.onclick = function() {
        infos.style.display = "block";
    };

    // Get a reference to our posts
    var ref = new Firebase("https://lanasantarosa.firebaseio.com/");

    // Attach an asynchronous callback to read the data at our posts reference
    ref.on(
        "value",
        function(snapshot) {
            jsobj = snapshot.val();

            btStart.onclick = function() {
                jogo();
            };
        },
        function(errorObject) {
            console.log("The read failed: " + errorObject.code);
        });

    directionsService = new google.maps.DirectionsService();

    // Assumes map has been initiated 
    streetView = map.getStreetView();
    //var controlPosition = google.maps.ControlPosition.RIGHT_CENTER;

    streetView.setOptions({enableCloseButton: false});

    //streetView.controls[controlPosition].push(globe);

    google.maps.event.addListener(streetView, "visible_changed", function() {
        if (streetView.getVisible()) {
            globe.style.display = "block";
        } else {
            globe.style.display = "none";
            aero.style.display = "none";
            btDvInfos.style.display = "none";
        }
    });

    google.maps.event.addDomListener(globe, 'click', function() {
        streetView.setVisible(false);
    });

};

function jogo() {
    missao = findById(jsobj.Missoes, 1);

    nomeMissao.innerHTML = missao.nome;

    localObj = findById(jsobj.Locais, missao.localInicio);

    addMarcador(localObj, true);

    var zoomServiceLocal = new google.maps.MaxZoomService();

    zoomServiceLocal.getMaxZoomAtLatLng(
        new google.maps.LatLng(localObj.lat, localObj.lng),
        function(maxZoomResult) {
            if (maxZoomResult.status != google.maps.MaxZoomStatus.OK) {
                console.error('Error was: ' + maxZoomResult.status);
            } else {
                map.setCenter(new google.maps.LatLng(localObj.lat, localObj.lng));
                map.setZoom(maxZoomResult.zoom);

                directionsDisplay = new google.maps.DirectionsRenderer({
                    suppressMarkers: true
                });
                directionsDisplay.setMap(map);
            }
        });

    locaisFilhos = getLocaisFilhos(localObj);

    localCidade = findById(jsobj.Locais, localObj.localPai);

    etapa = findById(jsobj.Etapas, 1);

    localEtapa = findById(jsobj.Locais, etapa.local);

    //var etapaFilha = findById(jsobj.Etapas, 2);

    destinoAtual = new google.maps.LatLng(localEtapa.lat, localEtapa.lng);

    addMarcador(localEtapa, false);

    marcadorDestinoAtual = marcadores.length - 1;

    preencheDicas();

    /*
     var zoomServiceDestino = new google.maps.MaxZoomService();
     
     zoomServiceDestino.getMaxZoomAtLatLng(
     destinoAtual,
     function(maxZoomResult) {
     if (maxZoomResult.status != google.maps.MaxZoomStatus.OK) {
     console.error('Error was: ' + maxZoomResult.status);
     } else {
     zoomDestinoAtual = maxZoomResult.zoom;
     }
     });
     */

    lastCenterCall = 0;

    google.maps.event.addListener(map, 'center_changed', function() {
        if (new Date().getTime() - lastCenterCall > 100) {
            centerMapPoint = map.getCenter();

            proximidade();
            habilitaMarcadores();

            /*
             var zoomServiceLocal = new google.maps.MaxZoomService();
             
             zoomServiceLocal.getMaxZoomAtLatLng(
             map.getCenter(),
             function(maxZoomResult) {
             if (maxZoomResult.status != google.maps.MaxZoomStatus.OK) {
             console.error('Error was: ' + maxZoomResult.status);
             } else {
             
             maxZoomAtual = maxZoomResult.zoom;
             
             habilitaMarcadores();
             
             //                        map.setCenter(new google.maps.LatLng(localObj.lat, localObj.lng));
             //                        map.setZoom(maxZoomResult.zoom);
             //
             //                        directionsDisplay = new google.maps.DirectionsRenderer();
             //                        directionsDisplay.setMap(map);
             
             }
             
             lastZoomCall = new Date().getTime();
             });
             */
            lastCenterCall = new Date().getTime();
        }
    });

    lastZoomCall = 0;

    google.maps.event.addListener(map, 'zoom_changed', function() {
        if (new Date().getTime() - lastZoomCall > 100) {
            //console.log(map.getZoom());

            var zoomServiceLocal = new google.maps.MaxZoomService();

            zoomServiceLocal.getMaxZoomAtLatLng(
                map.getCenter(),
                function(maxZoomResult) {
                    if (maxZoomResult.status != google.maps.MaxZoomStatus.OK) {
                        console.error('Error was: ' + maxZoomResult.status);
                    } else {
                        maxZoomAtual = maxZoomResult.zoom;
                    }

                    habilitaMarcadores();

                    lastZoomCall = new Date().getTime();
                });

            /*
             * map.getBounds().contains(marker.getPosition())
             */
        }
    });

    now = new Date();
    nowTime = now.getTime();
    gameDate = new Date(missao.inicio);
    gameTime = gameDate.getTime();

    relogio();

    setInterval(relogio, 1000);

    addObjetivos();

    prazo.innerHTML = new Date(missao.prazo).toLocaleString();

    cidade.innerHTML = localCidade.nome;

    splashScreen.style.display = "none";
    dvObjetivos.style.display = "block";

}

function relogio() {
    var tmpTime = new Date().getTime();

    gameTime = gameTime + (tmpTime - nowTime);

    gameDate = new Date(gameTime);

    now = new Date();
    nowTime = now.getTime();

    document.getElementById("relogio").innerHTML = gameDate.toLocaleString();

    if (gameTime > missao.prazo) {
        console.log("Prazo encerrado!");
    }
}

function initialize() {
    var mapOptions = {
        center: new google.maps.LatLng(-15.1534581, -147.8146355),
        zoom: 16,
        mapTypeId: google.maps.MapTypeId.HYBRID,
        rotateControl: true,
        mapTypeControl: false
    };

    map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);

}

function proximidade() {
    //if (localCidade.id === localEtapa.localPai) {
    var service = new google.maps.DistanceMatrixService();

    var destinos = Array();

    for (var i = 0; i < locaisFilhos.length; i++) {
        destinos.push(new google.maps.LatLng(locaisFilhos[i].lat, locaisFilhos[i].lng));
    }

    service.getDistanceMatrix({
        origins: [centerMapPoint],
//        destinations: [destinoAtual],
        destinations: destinos,
        //travelMode: google.maps.TravelMode.DRIVING,
        travelMode: google.maps.TravelMode.WALKING,
        unitSystem: google.maps.UnitSystem.METRIC,
        avoidHighways: false,
        avoidTolls: false
    }, function(response, status) {
        if (status != google.maps.DistanceMatrixStatus.OK) {
            console.error('Error was: ' + status);
        } else if (status != google.maps.DistanceMatrixStatus.ZERO_RESULTS) {
            var results = response.rows[0].elements;
            var menorDistancia = 999999999999;

            for (var j = 0; j < results.length; j++) {
                //console.log(results[j].distance.text);
                if (results[j].status !== "ZERO_RESULTS") {
                    if (results[j].distance.value < menorDistancia) {
                        distancia = menorDistancia = results[j].distance.value;
                    }
                } else {
                    distancia = 999999999999;
                }
            }

            var fatorDistancia = parseInt(distancia / 20);
            var valG = 255;
            var valB = 255;

            if (fatorDistancia <= 510) {
                if (fatorDistancia <= 255) {
                    valG = fatorDistancia;
                    valB = 0;
                } else {
                    valB = fatorDistancia - 255;
                }
            }

            document.getElementById("gRadar").style.fill = "rgb(255," + valG + "," + valB + ")";
        }
    });
    //}
}

function habilitaMarcadores() {

    if ((map.getZoom() + 1) >= maxZoomAtual) {
        for (var i = 0; i < marcadores.length; i++) {
//                                marcadores[marcadorDestinoAtual].setMap(map);
            if (map.getBounds().contains(marcadores[i].getPosition())) {
                marcadores[i].setMap(map);
            }
        }
    } else {
        for (var i = 0; i < marcadores.length; i++) {
            marcadores[i].setMap();
        }
    }

}

function localMessage() {

}

function findById(node, id) {
    for (var i = 0; i < node.length; i++) {
        if (node[i].id == id) {
            return node[i];
        }
    }

    return null;
}

function getLocaisFilhos(local) {
    var resLocaisFilhos = Array();

    for (var i = 0; i < jsobj.Locais.length; i++) {
        if (jsobj.Locais[i].localPai == local.id) {
            resLocaisFilhos.push(jsobj.Locais[i]);
        }
    }

    return resLocaisFilhos;
}

function indexOfLocaisFilhos(id) {
    for (var i = 0; i < locaisFilhos.length; i++) {
        if (locaisFilhos[i].id == id) {
            return i;
        }
    }

    return -1;
}

function preencheDicas() {
    listaDicas.innerHTML = "";

    for (var i = 0; i < jsobj.Dicas.length; i++) {
        if (indexOfLocaisFilhos(jsobj.Dicas[i].local) !== -1) {
            var liDica = document.createElement("li");
            var spLocal = document.createElement("span");
            var localAux = findById(jsobj.Locais, jsobj.Dicas[i].local);
            var txLocal = document.createTextNode(localAux.nome + ": ");
            var txDica = document.createTextNode(jsobj.Dicas[i].dica);

            spLocal.appendChild(txLocal);
            liDica.appendChild(spLocal);
            liDica.appendChild(txDica);

            listaDicas.appendChild(liDica);
        }
    }
}

function preencheInfos(local) {
    descInfo.innerHTML = "";

    var done = false;

    for (var i = 0; i < jsobj.Informacoes.length && done === false; i++) {
        if (jsobj.Informacoes[i].local == local.id) {
            descInfo.innerHTML = jsobj.Informacoes[i].informacao;
            done = true;
        }
    }
}

function proximoObjetivo() {
    etapasConcluidas.push(etapa.id);

    var tmpEtapa = findById(jsobj.Etapas, etapa.id + 1);

    if (tmpEtapa !== null) {
        etapa = tmpEtapa;

        localEtapa = findById(jsobj.Locais, etapa.local);

        destinoAtual = new google.maps.LatLng(localEtapa.lat, localEtapa.lng);

        addObjetivos();

        //addMarcador(localEtapa, false);
        //marcadorDestinoAtual = marcadores.length - 1;
    }
}

function addObjetivos() {
    ulObjetivos.innerHTML = "";

    for (var i = 0; i <= etapasConcluidas.length; i++) {
        var li = document.createElement("li");
        var tx = document.createTextNode(jsobj.Etapas[i].nome);
        li.appendChild(tx);

        if (etapasConcluidas.indexOf(jsobj.Etapas[i].id) !== -1) {
            li.setAttribute("class", "okay");
        }

        ulObjetivos.appendChild(li);
    }
}

function addPerguntaDeslocamento(localAtual) {
    tmpLocal = localAtual;

    localPergunta.innerHTML = localAtual.nome;

    titlePergunta.innerHTML = "Deseja se deslocar até este local?";

    tmpOrigem = new google.maps.LatLng(localObj.lat, localObj.lng);
    tmpDestino = new google.maps.LatLng(localAtual.lat, localAtual.lng);

    var dvSim = document.createElement("div");
    dvSim.setAttribute("class", "verde");
    var sim = document.createTextNode("SIM");
    dvSim.appendChild(sim);

    dvSim.onclick = function() {
        if (tmpDuracao > 0) {

            gameTime += tmpDuracao * 1000;

            gameDate = new Date(gameTime);

            directionsService.route({
                origin: tmpOrigem,
                destination: tmpDestino,
                travelMode: google.maps.TravelMode.DRIVING
            }, function(response, status) {
                if (status == google.maps.DirectionsStatus.OK) {
                    directionsDisplay.setDirections(response);
                }

                map.setZoom(map.getZoom() - 2);
            });

            tmpDuracao = 0;
        }

        pergunta.style.display = "none";

        //marcadorClicado = true;
        marcadores[marcadorDestinoAtual].clicado = true;

        setTimeout(function() {
            localObj = tmpLocal;

            if (localObj.id == etapa.local) {
                proximoObjetivo();
            }
            
            setMarcadoresFalse();

            var zoomServiceLocal = new google.maps.MaxZoomService();

            zoomServiceLocal.getMaxZoomAtLatLng(
                new google.maps.LatLng(localObj.lat, localObj.lng),
                function(maxZoomResult) {
                    if (maxZoomResult.status != google.maps.MaxZoomStatus.OK) {
                        console.error('Error was: ' + maxZoomResult.status);
                    } else {
                        map.setCenter(new google.maps.LatLng(localObj.lat, localObj.lng));
                        map.setZoom(maxZoomResult.zoom);
                        streetView.setPosition(new google.maps.LatLng(localObj.lat, localObj.lng));

                        /*
                         google.maps.event.clearListeners(marcadorDestinoAtual, 'click');
                         
                         google.maps.event.addListener(marcadorDestinoAtual, 'click', function() {
                         streetView.setPosition(marcadorDestinoAtual.getPosition());
                         streetView.setVisible(true);
                         });
                         */

                        //addObjetivos();

                        setTimeout(function() {
                            streetView.setVisible(true);

                            tmpLocal = null;
                            tmpOrigem = null;
                            tmpDestino = null;

                            if (aeroportos.indexOf(localObj.id) !== -1) {
                                aero.onclick = function() {
                                    addPerguntaViagem(localObj);
                                };

                                aero.style.display = "block";
                            } else {
                                setTimeout(function() {
                                    preencheInfos(localObj);

                                    infos.style.display = "block";

                                    btDvInfos.style.display = "block";
                                }, 3000);
                            }

                        }, 2000);
                    }
                });
        }, 2000);
    };

    var dvNao = document.createElement("div");
    dvNao.setAttribute("class", "vermelho");
    var nao = document.createTextNode("NÃO");
    dvNao.appendChild(nao);

    alternativasPergunta.innerHTML = "";

    alternativasPergunta.appendChild(dvSim);
    alternativasPergunta.appendChild(dvNao);

    var service = new google.maps.DistanceMatrixService();

    service.getDistanceMatrix({
        origins: [tmpOrigem],
        destinations: [tmpDestino],
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
        avoidHighways: false,
        avoidTolls: false
    }, function(response, status) {
        var distancia, duracao;

        if (status != google.maps.DistanceMatrixStatus.OK) {
            console.error('Error was: ' + status);
        } else {
            var results = response.rows[0].elements;
            for (var j = 0; j < results.length; j++) {
                //console.log(results[j].distance.text);
                distancia = results[j].distance.text;
                duracao = results[j].duration.text;
                tmpDuracao = results[j].duration.value;
            }
        }

        var txDistancia = document.createTextNode("Distância total: " + distancia);
        var br1 = document.createElement("br");
        var br2 = document.createElement("br");
        var txTempo = document.createTextNode("Tempo estimado: " + duracao);

        dicaPergunta.innerHTML = "";

        dicaPergunta.appendChild(txDistancia);
        dicaPergunta.appendChild(br1);
        dicaPergunta.appendChild(br2);
        dicaPergunta.appendChild(txTempo);

        pergunta.style.display = "block";

    });
}

function addPerguntaViagem(localAtual) {
    tmpLocal = localAtual;

    localPergunta.innerHTML = localAtual.nome;

    titlePergunta.innerHTML = "Para onde deseja viajar?";

    alternativasPergunta.innerHTML = "";

    dicaPergunta.innerHTML = "";

    for (var i = 0; i < jsobj.Deslocamentos.length; i++) {
        if (jsobj.Deslocamentos[i].localOrigem == localAtual.id) {
            var aeroporto = findById(jsobj.Locais, jsobj.Deslocamentos[i].localDestino);
            var cidadeObj = findById(jsobj.Locais, aeroporto.localPai);

            var dvCid = document.createElement("div");
            dvCid.setAttribute("class", "ciano font-30 width-33");
            dvCid.setAttribute("local", aeroporto.id);
            dvCid.setAttribute("tempo", jsobj.Deslocamentos[i].tempoValor);
            var cidadeNome = document.createTextNode(cidadeObj.nome);
            dvCid.appendChild(cidadeNome);

            dvCid.onclick = function() {

                localObj = findById(jsobj.Locais, parseInt(this.getAttribute("local")));

                gameTime += parseInt(this.getAttribute("tempo")) * 60000;

                gameDate = new Date(gameTime);

                localCidade = findById(jsobj.Locais, localObj.localPai);

                cidade.innerHTML = localCidade.nome;

                locaisFilhos = getLocaisFilhos(localObj);

                preencheDicas();

                addMarcador(localObj, true);

                if (localObj.id == etapa.local) {
                    proximoObjetivo();
                }

                addMarcadores();

                var zoomServiceLocal = new google.maps.MaxZoomService();

                zoomServiceLocal.getMaxZoomAtLatLng(
                    new google.maps.LatLng(localObj.lat, localObj.lng),
                    function(maxZoomResult) {
                        if (maxZoomResult.status != google.maps.MaxZoomStatus.OK) {
                            console.error('Error was: ' + maxZoomResult.status);
                        } else {
                            streetView.setVisible(false);

                            map.setCenter(new google.maps.LatLng(localObj.lat, localObj.lng));
                            map.setZoom(maxZoomResult.zoom);

                            streetView.setPosition(new google.maps.LatLng(localObj.lat, localObj.lng));

                            //gameTime += tmpDuracao * 1000;
                        }
                    });

            };

            alternativasPergunta.appendChild(dvCid);

            var distancia = parseInt(getDistance(new google.maps.LatLng(localAtual.lat, localAtual.lng), new google.maps.LatLng(aeroporto.lat, aeroporto.lng)) / 1000);

            var txDistancia = document.createTextNode("Distância total: " + distancia + " km");
            var br1 = document.createElement("br");
            var br2 = document.createElement("br");
            var txTempo = document.createTextNode("Tempo estimado: " + jsobj.Deslocamentos[i].tempoTexto);

            var dvDica = document.createElement("div");
            dvDica.setAttribute("class", "width-33");

            dvDica.appendChild(txDistancia);
            dvDica.appendChild(br1);
            dvDica.appendChild(br2);
            dvDica.appendChild(txTempo);

            dicaPergunta.appendChild(dvDica);
        }
    }

    pergunta.style.display = "block";
    /*
     var dvSim = document.createElement("div");
     dvSim.setAttribute("class", "verde");
     var sim = document.createTextNode("SIM");
     dvSim.appendChild(sim);
     */
}

function addMarcador(destino, clicado) {
    var tmpMarcador = new google.maps.Marker({
        position: new google.maps.LatLng(destino.lat, destino.lng),
        title: destino.nome,
        local: destino,
        clicado: clicado
    });

    marcadores.push(tmpMarcador);

    /*google.maps.event.addListener(marcadores[marcadores.length - 1], 'click', function(marcador) {
     if (marcador.clicado === false) {
     var local = findById(jsobj.Locais, marcador.local);
     addPerguntaDeslocamento(local);
     } else {
     streetView.setPosition(marcador.getPosition());
     streetView.setVisible(true);
     }
     }(marcadores[marcadores.length - 1]));*/

    google.maps.event.addListener(marcadores[marcadores.length - 1], 'click', function() {
        if (this.clicado === false) {
            //var local = findById(jsobj.Locais, this.local);
            addPerguntaDeslocamento(this.local);
        } else {
            streetView.setPosition(this.getPosition());
            streetView.setVisible(true);

            if (aeroportos.indexOf(this.local.id) !== -1) {
                aero.onclick = function() {
                    addPerguntaViagem(localObj);
                };

                aero.style.display = "block";
                //setTimeout(function() {
                //addPerguntaViagem(localObj);
                //}, 2000);
            } else {
                preencheInfos(this.local);
                btDvInfos.style.display = "block";
            }
        }
    });

}

function addMarcadores() {
    for (var i = 0; i < locaisFilhos.length; i++) {
        addMarcador(locaisFilhos[i], false);

        if (locaisFilhos[i].id == etapa.local) {
            marcadorDestinoAtual = marcadores.length - 1;
        }
    }
}

function setMarcadoresFalse() {
    for (var i = 0; i < marcadores.length; i++) {
        if (marcadores[i].local.id == localObj.id) {
            marcadores[i].clicado = true;
        } else {
            marcadores[i].clicado = false;
        }
    }
}

function verificaEtapa() {

}