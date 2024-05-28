package main

// TODO Add method to reply to server

//jsonBody := []byte(`{"filename": "` + name + `", "input": "` + message.Data.Filename + `"}`)
//bodyReader := bytes.NewReader(jsonBody)
//req, err := http.NewRequestWithContext(ctx, http.MethodPost, env.APIUrl+"/image-result", bodyReader)
//if err != nil {
//	log.Fatal(err)
//}
//req.Header.Set("Content-Type", "application/json")
//
//res, err := http.DefaultClient.Do(req)
//if err != nil {
//	log.Fatal(err)
//}
//
//if res.StatusCode != http.StatusOK {
//	log.Fatal("Failed to send image result to API")
//}
//
//resBody, err := io.ReadAll(res.Body)
//if err != nil {
//	fmt.Printf("client: could not read response body: %s\n", err)
//	os.Exit(1)
//}
//fmt.Printf("client: response body: %s\n", resBody)
