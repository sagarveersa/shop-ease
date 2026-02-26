import smtplib

server = smtplib.SMTP("smtp.gmail.com", 587)
server.starttls()

server.login(
    "remedix70@gmail.com",
    "bnsymheumojuqqcj"  # app passwordh
)

print("LOGIN SUCCESS")
server.quit()