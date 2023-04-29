package com.tads.wordleweb3;

import java.io.*;
import java.util.*;

import jakarta.servlet.http.*;
import jakarta.servlet.annotation.*;

@WebServlet(name = "checkGuess", value = "/check-guess")
public class GuessServlet extends HttpServlet {

    private static final int WORD_SIZE = 5;

    private String getRandomWord() {
        return Constants.targetWords.get(new Random().nextInt(Constants.targetWords.size()));
    }

    public void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {

        final HttpSession currentSession = request.getSession();

        if (currentSession.isNew()) {
            System.out.println("New session being created with ID: " + currentSession.getId());
            currentSession.setAttribute("word", getRandomWord());
        }

        final String sessionWord = currentSession.getAttribute("word").toString();
        final String guess = request.getParameter("guess");

        System.out.println(currentSession.getId() + ": " + sessionWord);

        PrintWriter writer = response.getWriter();

        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "*");
        response.setHeader("Access-Control-Allow-Headers", "*");

        if (guess == null) {
            response.setContentType("text/xml;charset=UTF-8");
            writer.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
            response.setStatus(200);
            writer.append("<word>").append(sessionWord).append("</word>");
        } else {
            if (guess.length() != 5) {
                response.setStatus(422);
                response.addHeader("message", "The word should have 5 letters!");
            } else if (!Constants.dictionary.contains(guess.toLowerCase())) {
                response.setStatus(422);
                response.addHeader("message", "Not in word list");
            } else {
                response.setContentType("text/xml;charset=UTF-8");
                writer.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
                response.setStatus(200);
                final ArrayList<String> dailyWordLetters = new ArrayList<>(List.of(sessionWord.split("")));

                final String[] guessLetters = guess.split("");
                final String[] output = new String[WORD_SIZE];

                for (int i = 0; i < WORD_SIZE; i++) {
                    if (dailyWordLetters.get(i).equals(guessLetters[i])) {
                        output[i] = LetterStatus.CORRECT.toString().toLowerCase();
                        dailyWordLetters.set(i, "-");
                    }
                }

                for (int i = 0; i < WORD_SIZE; i++) {
                    if (!dailyWordLetters.get(i).equals("-")) {
                        if (dailyWordLetters.contains(guessLetters[i])) {
                            output[i] = LetterStatus.WRONG_PLACE.toString().toLowerCase();
                        } else {
                            output[i] = LetterStatus.WRONG.toString().toLowerCase();
                        }
                    }
                }

                System.out.println(dailyWordLetters);

                writer.append("<result>");

                List.of(output).forEach(status -> {
                    System.out.println(status);
                    writer.append("<status>").append(status).append("</status>");
                });

                writer.append("</result>");
            }
        }
    }

    public void destroy() {
    }
}