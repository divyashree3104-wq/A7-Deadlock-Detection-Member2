package a7.deadlock;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.Map;
import java.util.stream.Collectors;

public class DeadlockServer {
    private static final Path WEB = Path.of("web");

    public static void main(String[] args) throws Exception {
        int port = args.length > 0 ? Integer.parseInt(args[0]) : 8080;
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
        server.createContext("/detect", DeadlockServer::detect);
        server.createContext("/", DeadlockServer::staticFiles);
        server.start();
        System.out.println("A7 Deadlock Detection dashboard: http://localhost:" + port);
        System.out.println("Press Ctrl+C to stop the server.");
    }

    private static void detect(HttpExchange exchange) throws IOException {
        if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
            send(exchange, 405, "{\"error\":\"POST required\"}", "application/json");
            return;
        }
        try {
            String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
            Map<String, String> form = Arrays.stream(body.split("&"))
                    .map(pair -> pair.split("=", 2))
                    .collect(Collectors.toMap(a -> decode(a[0]), a -> a.length > 1 ? decode(a[1]) : ""));
            int[] available = parseVector(form.get("available"));
            int[][] allocation = parseMatrix(form.get("allocation"));
            int[][] request = parseMatrix(form.get("request"));
            DeadlockDetection.Result result = DeadlockDetection.detect(available, allocation, request);
            String json = "{\"deadlock\":" + result.deadlock()
                    + ",\"deadlockedProcesses\":" + result.deadlockedProcesses()
                    + ",\"completionOrder\":" + result.completionOrder()
                    + ",\"finalWork\":" + Arrays.toString(result.finalWork())
                    + ",\"finish\":" + Arrays.toString(result.finish())
                    + ",\"trace\":" + toJson(result.trace()) + "}";
            send(exchange, 200, json, "application/json");
        } catch (Exception e) {
            send(exchange, 400, "{\"error\":\"" + escape(e.getMessage()) + "\"}", "application/json");
        }
    }

    private static void staticFiles(HttpExchange exchange) throws IOException {
        String requested = exchange.getRequestURI().getPath();
        if (requested.equals("/")) requested = "/index.html";
        Path file = WEB.resolve(requested.substring(1)).normalize();
        if (!file.startsWith(WEB) || !Files.isRegularFile(file)) {
            send(exchange, 404, "Not found", "text/plain");
            return;
        }
        String type = file.toString().endsWith(".css") ? "text/css"
                : file.toString().endsWith(".js") ? "application/javascript" : "text/html";
        send(exchange, 200, Files.readString(file), type);
    }

    private static int[] parseVector(String text) {
        return Arrays.stream(text.split(",")).map(String::trim).mapToInt(Integer::parseInt).toArray();
    }

    private static int[][] parseMatrix(String text) {
        return Arrays.stream(text.split(";"))
                .map(row -> parseVector(row)).toArray(int[][]::new);
    }

    private static String decode(String value) {
        return URLDecoder.decode(value, StandardCharsets.UTF_8);
    }

    private static String toJson(Iterable<String> values) {
        StringBuilder out = new StringBuilder("[");
        boolean first = true;
        for (String value : values) {
            if (!first) out.append(",");
            first = false;
            out.append("\"").append(escape(value)).append("\"");
        }
        return out.append("]").toString();
    }

    private static String escape(String value) {
        if (value == null) return "Unknown error";
        return value.replace("\\", "\\\\").replace("\"", "\\\"")
                .replace("\n", "\\n").replace("\r", "\\r");
    }

    private static void send(HttpExchange exchange, int status, String body, String type) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", type + "; charset=utf-8");
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.sendResponseHeaders(status, bytes.length);
        exchange.getResponseBody().write(bytes);
        exchange.close();
    }
}
