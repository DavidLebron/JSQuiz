var contentDiv = document.getElementById('content-quiz');
var infosDiv = document.getElementById('infos');
var gameDiv = document.getElementById('question-answer');

var playerScore = 0;
var playerLife = 3;
var isGameOn = true;

var model = {
  createStartButton: function() {
    startButton = document.createElement('button');
    startButton.textContent = 'Start the quizz';
    startButton.className += 'btn btn-primary';
    startButton.addEventListener('click', function() {
      view.displayQuestion();
    })
    return startButton;
  },
  createQuestionDiv: function() {
    questionDiv = document.createElement('h5');
    questionDiv.id = 'questionDiv';
    questionDiv.className = 'card-title';
    questionDiv.textContent = controller.getQuestion();
    return questionDiv;
  },
  createAnswers: function() {
    answersDiv = document.createElement('ul');
    answersDiv.className = 'list-group list-group';
    answersDiv.id = 'answers';
    controller.getAnswers();
    return answersDiv;
  },
  createTimer: function() {
    var timerDiv = document.createElement('div');
    timerDiv.id = 'timerDiv';
    timerDiv.className += 'col-12 col-lg-5';
    timerDiv.textContent = '20';
    return timerDiv;
  },
  createStats: function() {
    var statsDiv = document.createElement('div');
    statsDiv.className += ('col-12 col-lg-7');
    var life = document.createElement('p');
    life.id = 'life';
    life.textContent = 'Your lifes : ' + playerLife;
    statsDiv.appendChild(life);
    var score = document.createElement('p');
    score.id = 'score';
    score.textContent = 'Your score : ' + playerScore;
    statsDiv.appendChild(score);
    return statsDiv;
  },
  createRestartButton: function() {
    var refresh = document.createElement('button');
    refresh.textContent = 'Try again';
    refresh.type = 'submit';
    refresh.className += 'btn btn-primary';
    refresh.addEventListener('click', function() {
      window.location.reload();
    })
    return refresh
  },
  createEndElement: function(endResult) {
    var endTitle = document.createElement('h1');
    endTitle.textContent = endResult;
    var endScore = document.createElement('p');
    endScore.textContent = " You scored : " + playerScore.toFixed(0) + " points";
    contentDiv.appendChild(endTitle);
    contentDiv.appendChild(endScore);
  }
}


var view = {
  displayReady: function() {
    infosDiv.textContent = 'Your quizz is ready :  ';
    gameDiv.textContent = '';
    gameDiv.appendChild(model.createRestartButton())
    gameDiv.appendChild(model.createStartButton());
  },
  displayStats: function() {
    model.createStats();
  },
  displayQuestion: function() {
    gameDiv.textContent = '';
    infosDiv.textContent = '';
    if (isGameOn) {
      infosDiv.appendChild(model.createStats());
      infosDiv.appendChild(model.createTimer());
      gameDiv.appendChild(model.createQuestionDiv());
      gameDiv.appendChild(model.createAnswers());
      controller.timer();
    }
    //console.log(questionnaire);
  },
  displayGoodAnswer: function(playerAnswer, result) {

    if (result) {
      playerAnswer.className += ' green';
      controller.countScore();
    } else {
      playerAnswer.className += ' red';
      controller.countLife();
    };
  },
  displayEndGame: function(result) {
    model.createEndElement(result);
    contentDiv.appendChild(model.createRestartButton());

  }
}


var controller = {
  setUpFormListener: function() {
    var form = document.querySelector("form");
    form.addEventListener("submit", function(e) {
      e.preventDefault();
      var category = document.getElementById('category').value;
      var difficulty = document.getElementById('difficulty').value;

      var request = 'https://opentdb.com/api.php?amount=20&category=' + category + '&difficulty=' + difficulty + '&encode=url3986';
      console.log(request);
      ajaxGet(request, function(apiAnswer) {
        questionnaire = JSON.parse(apiAnswer).results;
        console.log(questionnaire);

        controller.checkResponseCode(JSON.parse(apiAnswer).response_code)
      });
    });
  },
  checkResponseCode : function(code){
    var errorMessage = document.createElement('p');
    // Traitement des erreurs
    if (code == 0) {
      view.displayReady();
      return
    } else if (code == 1){
      errorMessage.textContent = 'Sorry, there is no result for this quiz. Please try another one';
    } else {
      errorMessage.textContent = 'Oops, something went wrong, please try again';
    }
    contentDiv.textContent = '';
    contentDiv.appendChild(errorMessage);
    contentDiv.appendChild(model.createRestartButton());
  },
  timer: function() {
    function timerStart() {
      var time = Number(timerDiv.textContent);
      timerDiv.textContent = (time - 0.01).toFixed(2);
      controller.timerCheck(time);
    }
    intervalGame = setInterval(timerStart, 10);
  },
  timerCheck: function(count) {
    if (count === 0) {
      clearInterval(intervalGame);
      controller.countLife();
      questionnaire.splice(0, 1);
      view.displayQuestion();
    }
  },
  getQuestion: function() {
    if (questionnaire.length == 0) {
      var noQuestion = true;
      controller.endGame(noQuestion)
      return
    };
    var question = decodeURIComponent(questionnaire[0].question);
    return question;
  },
  getAnswers: function() {
    var answers = questionnaire[0].incorrect_answers;
    answers.push(questionnaire[0].correct_answer);
    console.log(questionnaire[0].correct_answer);
    while (answers.length > 0) {
      var random = Math.floor(Math.random() * answers.length);
      var choice = document.createElement('li');
      choice.className = "list-group-item";
      choice.textContent = decodeURIComponent(answers[random]);
      answersDiv.appendChild(choice);
      answers.splice(random, 1);
    }
    controller.answerListener();
  },
  answerListener: function() {
    answersDiv.addEventListener('click', function validate(event) {
      // Verifie si le click est sur un LI
      if (event.target.tagName.toUpperCase() == 'LI') {
        answersDiv.removeEventListener('click', validate);
        clearInterval(intervalGame);

        var answerSelected = event.target;
        var correctAnswer = decodeURIComponent(questionnaire[0].correct_answer);
        var isGood = false;
        if (answerSelected.textContent === correctAnswer) {
          isGood = true;
        }
        view.displayGoodAnswer(answerSelected, isGood);
        // Temps d'arret avant la prochaine question
        setTimeout(function() {
          gameDiv.textContent = '';
          questionnaire.splice(0, 1);
          view.displayQuestion();
        }, 500);
      }
    });
  },
  countScore: function() {
    playerScore += 100 * Number(timerDiv.textContent);
  },
  countLife: function() {
    playerLife -= 1;
    if (playerLife === 0) {
      controller.endGame();

    }
  },
  endGame: function(noMoreQuestion) {
    contentDiv.textContent = '';
    var end = "No more life. GAME OVER";
    if (noMoreQuestion) {
      end = "Congratulations, you answered all the questions!!";
    }
    view.displayEndGame(end);
    isGameOn = false;
  }

}

controller.setUpFormListener();
