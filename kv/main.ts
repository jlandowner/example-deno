try {
    const kv = await Deno.openKv("http://localhost:4512");

    await kv.set(["users", "alice"], {
      name: "Alice",
      birthday: new Date(2019, 5, 13),
    });

    await kv.set(["users", "bob"], {
      name: "Bob",
      birthday: new Date(2023, 11, 13),
    });
    
    const alice = await kv.get(["users", "alice"]);
    console.log(alice.value);

    const users = await kv.list({prefix: ["users"]})
    for await (const user of users) {
      console.log(user.value);
    }
    
} catch (e) {
    console.log(e);
}
