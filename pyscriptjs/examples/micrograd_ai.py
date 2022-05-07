# Credit: https://github.com/karpathy/micrograd/blob/master/demo.ipynb
# cell
import datetime
import random

import matplotlib.pyplot as plt
import numpy as np

# cell
from micrograd.engine import Value
from micrograd.nn import MLP

print_statements = []


def run_all_micrograd_demo(*args, **kwargs):
    result = micrograd_demo()
    pyscript.write("micrograd-run-all-fig2-div", result)


def print_div(o):
    o = str(o)
    print_statements.append(o + " \n<br>")
    pyscript.write("micrograd-run-all-print-div", "".join(print_statements))


# All code is wrapped in this run_all function so it optionally executed (called)
# from pyscript when a button is pressed.
def micrograd_demo(*args, **kwargs):
    """
    Runs the micrograd demo.

    *args and **kwargs do nothing and are only there to capture any parameters passed
    from pyscript when this function is called when a button is clicked.
    """

    # cell
    start = datetime.datetime.now()
    print_div("Starting...")

    # cell
    np.random.seed(1337)
    random.seed(1337)

    # cell
    # An adaptation of sklearn's make_moons function
    # https://scikit-learn.org/stable/modules/generated/sklearn.datasets.make_moons.html
    def make_moons(n_samples=100, noise=None):
        n_samples_out, n_samples_in = n_samples, n_samples

        outer_circ_x = np.cos(np.linspace(0, np.pi, n_samples_out))
        outer_circ_y = np.sin(np.linspace(0, np.pi, n_samples_out))
        inner_circ_x = 1 - np.cos(np.linspace(0, np.pi, n_samples_in))
        inner_circ_y = 1 - np.sin(np.linspace(0, np.pi, n_samples_in)) - 0.5

        X = np.vstack(
            [
                np.append(outer_circ_x, inner_circ_x),
                np.append(outer_circ_y, inner_circ_y),
            ]
        ).T
        y = np.hstack(
            [
                np.zeros(n_samples_out, dtype=np.intp),
                np.ones(n_samples_in, dtype=np.intp),
            ]
        )
        if noise is not None:
            X += np.random.normal(loc=0.0, scale=noise, size=X.shape)
        return X, y

    X, y = make_moons(n_samples=100, noise=0.1)

    # cell
    y = y * 2 - 1  # make y be -1 or 1
    # visualize in 2D
    plt.figure(figsize=(5, 5))
    plt.scatter(X[:, 0], X[:, 1], c=y, s=20, cmap="jet")
    plt
    pyscript.write("micrograd-run-all-fig1-div", plt)

    # cell
    model = MLP(2, [16, 16, 1])  # 2-layer neural network
    print_div(model)
    print_div(("number of parameters", len(model.parameters())))

    # cell
    # loss function
    def loss(batch_size=None):
        # inline DataLoader :)
        if batch_size is None:
            Xb, yb = X, y
        else:
            ri = np.random.permutation(X.shape[0])[:batch_size]
            Xb, yb = X[ri], y[ri]
        inputs = [list(map(Value, xrow)) for xrow in Xb]

        # forward the model to get scores
        scores = list(map(model, inputs))

        # svm "max-margin" loss
        losses = [(1 + -yi * scorei).relu() for yi, scorei in zip(yb, scores)]
        data_loss = sum(losses) * (1.0 / len(losses))
        # L2 regularization
        alpha = 1e-4
        reg_loss = alpha * sum(p * p for p in model.parameters())
        total_loss = data_loss + reg_loss

        # also get accuracy
        accuracy = [
            ((yi).__gt__(0)) == ((scorei.data).__gt__(0))
            for yi, scorei in zip(yb, scores)
        ]
        return total_loss, sum(accuracy) / len(accuracy)

    total_loss, acc = loss()
    print((total_loss, acc))

    # cell
    # optimization
    for k in range(20):  # was 100

        # forward
        total_loss, _ = loss()

        # backward
        model.zero_grad()
        total_loss.backward()

        # update (sgd)
        learning_rate = 1.0 - 0.9 * k / 100
        for p in model.parameters():
            p.data -= learning_rate * p.grad

        if k % 1 == 0:
            # print(f"step {k} loss {total_loss.data}, accuracy {acc*100}%")
            print_div(f"step {k} loss {total_loss.data}, accuracy {acc*100}%")

    # cell
    h = 0.25
    x_min, x_max = X[:, 0].min() - 1, X[:, 0].max() + 1
    y_min, y_max = X[:, 1].min() - 1, X[:, 1].max() + 1
    xx, yy = np.meshgrid(np.arange(x_min, x_max, h), np.arange(y_min, y_max, h))
    Xmesh = np.c_[xx.ravel(), yy.ravel()]
    inputs = [list(map(Value, xrow)) for xrow in Xmesh]
    scores = list(map(model, inputs))
    Z = np.array([(s.data).__gt__(0) for s in scores])
    Z = Z.reshape(xx.shape)

    _ = plt.figure()
    plt.contourf(xx, yy, Z, cmap=plt.cm.Spectral, alpha=0.8)
    plt.scatter(X[:, 0], X[:, 1], c=y, s=40, cmap=plt.cm.Spectral)
    plt.xlim(xx.min(), xx.max())
    plt.ylim(yy.min(), yy.max())

    finish = datetime.datetime.now()
    print_div(f"It took {(finish-start).seconds} seconds to run this code.")

    plt
    return plt
